{
    init: function(elevators, floors) {
        queue = [];

        _.each(floors, function(floor) {
            floor._ = {};
            floor._.ucount = 0;
            floor._.dcount = 0;

            floor.on('up_button_pressed', function() {
                floor._.ucount++;
            });

            floor.on('down_button_pressed', function() {
                floor._.dcount++;
            });
        });

        isFull = function(elevator) { return elevator.loadFactor() > 0.7; };

        isEmpty = function(elevator) { return elevator.loadFactor() == 0.0; };

        isAnybodyWaiting = function(floor) { return floor._.ucount + floor._.dcount; };

        idleOptimalReducerProvider = function(elevator) {
            return function(current, floor) {
                result = null;
                if (floor._.ucount || floor._.dcount) {
                    result = { 
                        floor: floor, 
                        direction: floor._.ucount > floor._.dcount ? 'up' : 'down',
                        distance: Math.abs(elevator.currentFloor() - floor.floorNum())
                    };
                }

                if (!result) {
                    return current;
                }

                if (!current) {
                    return result;
                }

                return result.distance < current.distance ? result : current;
            };
        };

        goToFloor = function(elevator, floor, override) { elevator.goToFloor(floor.floorNum(), override); };

        setDirectionIndicator = function(elevator, direction) {
            params = { up: true, down: true };
            
            if (direction == 'up') {
                params.down = false;
            } if (direction == 'down') {
                params.up = false;
            }

            elevator.goingUpIndicator(params.up);
            elevator.goingDownIndicator(params.down);
        }

        _.each(elevators, function(elevator) {
            elevator._ = {};

            elevator.on('idle', function() {
                result = _.reduce(floors, idleOptimalReducerProvider(elevator), null);

                setDirectionIndicator(elevator, 'none') // TODO: should remove

                if (result) {
                    goToFloor(elevator, result.floor, false);
                    setDirectionIndicator(elevator, result.direction);
                } else {
                    // Quick hack to force idle event to raise each cyle, not just the first cycle the
                    // elevator became idle.
                    elevator.stop();
                }
            });

            elevator.on('passing_floor', function(floorNum, direction) {
                floor = floors[floorNum];

                if (!isAnybodyWaiting(floor)) {
                    return;
                }

                // If the elevator is empty, allow it to stop at the passing floor if anybody is waiting,
                // independent of the direction the people are waiting to travel on that floor. Should
                // eventually account for an existing elevator targeting this floor, in which case we can
                // skip the waiting people since another elevator is already intending on stopping there.
                if (isEmpty(elevator)) {
                    console.log('Empty elevator stopping to pick up passing floor');
                    if (floor._.ucount > floor._.dcount) {
                        setDirectionIndicator(elevator, 'up');
                    } else {
                        setDirectionIndicator(elevator, 'down');
                    }

                    goToFloor(elevator, floor, true);

                    return;
                }

                // If the elevator is full, early out since it is unable to pick up any additional passengers.
                if (isFull(elevator)) {
                    return;
                }

                // Check to see if anybody is waiting on the floor to go the same direction as the elevator
                // is currently traveling. If so, stop to pick them up since they are on the way to the
                // elevator's destination floor.
                if ((direction == 'up' && floor._.ucount) || (direction == 'down' && floor._.dcount)) {
                    goToFloor(elevator, floor, true);
                }
            });

            elevator.on('stopped_at_floor', function(floorNum) {
                // If there are no more floors to travel to, then the elevator has arrived at it's destination.
                // Need to update the direction indicators to allow anybody who might appear on the
                // elevator's current floor to get on.
                if (elevator.destinationQueue.length == 0) {
                    setDirectionIndicator(elevator, 'none');
                }
            });

            elevator.on('floor_button_pressed', function(floorNum) {
                elevatorFloor = floors[elevator.currentFloor()];

                // Before the person pressed a floor button, they either hit the up button or down button
                // on the floor. Check which direction they are traveling by checking if they are going
                // to a floor above or below of floor the elevator is currently at, and decrement that
                // floor counts direction. Additionally, update the direction indicator for the elevator
                // incase the elevator is currently sitting idle on the current floor.
                if (floorNum > elevatorFloor.floorNum()) {
                    elevatorFloor._.ucount--;
                    if (elevatorFloor._.ucount < 0) { elevatorFloor._.ucount = 0; }
                    setDirectionIndicator(elevator, 'up');
                    sortFunction = function(floorNum) { return floorNum; };
                } else {
                    elevatorFloor._.dcount--;
                    if (elevatorFloor._.dcount < 0) { elevatorFloor._.dcount = 0; }
                    setDirectionIndicator(elevator, 'down');
                    sortFunction = function(floorNum) { return 100 - floorNum; };
                    console.log('down');
                    if (elevatorFloor._.ucount < 0) { throw 'fail down'; }
                }

                // If the floor pressed is not already in the destination queue for the elevator, then
                // add it and sort by the closest floor to the furthest.
                if (!_.contains(elevator.destinationQueue, floorNum)) {
                    elevator.destinationQueue.push(floorNum);
                    elevator.destinationQueue = _.sortBy(elevator.destinationQueue, sortFunction);
                    elevator.checkDestinationQueue();
                }
            });
        });
    },
    update: function(dt, elevators, floors) {
        // console.log('UCOUNT:', _.map(floors, function(floor) { return floor._.ucount; }));
        // console.log('DCOUNT:', _.map(floors, function(floor) { return floor._.dcount; }));
        // console.log('PRESSED:', queue);
        // console.log('P2:', elevators[0].getPressedFloors());
    }
}