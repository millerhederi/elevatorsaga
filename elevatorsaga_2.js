{
    init: function(elevators, floors) {
        queue = [];

        _.each(floors, function(floor) {
            floor._ = {};
            floor._.ucount = 0;
            floor._.dcount = 0;

            floor._.elevatorsEnRoute = [];

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

        getElevatorEnRouteCount = function(floor, direction) {
            selector = function(elevator) {
                return _.contains(elevator.destinationQueue, floor.floorNum())
                    && (direction == 'up' ? elevator.goingUpIndicator() : elevator.goingDownIndicator());
            };

            return _.filter(elevators, selector).length;
        };

        getDirectionForIdleFloorSelection = function(floor) {
            ucount = 0;
            dcount = 0;

            if (floor._.ucount && getElevatorEnRouteCount(floor, 'up') < 2) {
                ucount = floor._.ucount;
            }

            if (floor._.dcount && getElevatorEnRouteCount(floor, 'down') < 2) {
                dcount = floor._.dcount;
            }

            if (!ucount && !dcount) {
                return null;
            }

            return ucount < dcount ? 'down' : 'up';
        };

        getFloorIdleSelection = function(elevator, floor) {
            ucount = 0;
            dcount = 0;

            if (floor._.ucount && getElevatorEnRouteCount(floor, 'up') < 1) {
                ucount = floor._.ucount;
            }

            if (floor._.dcount && getElevatorEnRouteCount(floor, 'down') < 1) {
                dcount = floor._.dcount;
            }

            if (!ucount && !dcount) {
                return null;
            }

            distance = Math.abs(elevator.currentFloor() - floor.floorNum())

            return {
                floor: floor,
                direction: ucount < dcount ? 'down' : 'up',
                distance: distance
            };
        }

        idleOptimalReducerProvider = function(elevator) {
            return function(current, floor) {
                result = getFloorIdleSelection(elevator, floor);

                if (!result) {
                    return current;
                }

                if (!current) {
                    return result;
                }

                return result.distance < current.distance ? result : current;
            };
        };

        goToFloor = function(elevator, floor, override) { 
            elevator.goToFloor(floor.floorNum(), override);
        };

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

                // Check if the floor pressed is above or below the current floor the elevator is at.
                // Zero the elevators floor count in that direction. Note that there is a possibility
                // that the elevator was filled to capacity with people remaining on the floor and thus
                // the count should be greater than zero; however, they will repress the arrow on the floor
                // if they could not enter the elevator upon its departure. Additionally, update the direction 
                // indicator for the elevator incase the elevator is currently sitting idle on the current
                // floor. Finally, need to get a sort function to later update the destination queue.
                if (floorNum > elevatorFloor.floorNum()) {
                    elevatorFloor._.ucount = 0;
                    setDirectionIndicator(elevator, 'up');
                    sortFunction = function(floorNum) { return floorNum; };
                } else {
                    elevatorFloor._.dcount = 0;
                    setDirectionIndicator(elevator, 'down');
                    sortFunction = function(floorNum) { return 100 - floorNum; };
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
    }
}