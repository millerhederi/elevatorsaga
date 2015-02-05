{
    init: function(elevators, floors) {
        NIL = Number.MAX_SAFE_INTEGER;

        _.each(floors, function(floor) {
            floor._ = {};
            floor._.utime = NIL;
            floor._.dtime = NIL;

            floor.on('up_button_pressed', function() {
                floor._.utime = Date.now();
                console.log('up');
            });

            floor.on('down_button_pressed', function() {
                floor._.dtime = Date.now();
                console.log('down');
            });
        });

        getClosestFloor = function(floors, currentFloor) {
            closestFloor = null;

            _.each(floors, function(floor) {
                if (closestFloor == null || Math.abs(floor.floorNum() - currentFloor.floorNum()) < Math.abs(closestFloor.floorNum() - currentFloor.floorNum())) {
                    closestFloor = floor;
                }
            });

            return closestFloor;
        };

        updateElevatorDirection = function(elevator, targetFloor) {
            if (targetFloor == null) {
                elevator.goingUpIndicator(true);
                elevator.goingDownIndicator(true);
                return;
            }

            if (targetFloor.floorNum() > elevator.currentFloor()) {
                elevator.goingDownIndicator(false);
                elevator.goingUpIndicator(true);
                return;
            }

            if (targetFloor.floorNum() < elevator.currentFloor()) {
                elevator.goingDownIndicator(true);
                elevator.goingUpIndicator(false);
                return;
            }

            elevator.goingUpIndicator(true);
            elevator.goingDownIndicator(true);
        };

        _.each(elevators, function(elevator) {
            elevator._ = {};

            elevator.on('idle', function() {
                floorsPendingProcessing = _.filter(floors, function(floor) { return floor._.utime != NIL || floor._.dtime != NIL });

                floor = getClosestFloor(floorsPendingProcessing, floors[elevator.currentFloor()]);

                // Hack to force idle
                if (floor == null) {
                    // floor = floors[0];
                    elevator.stop();
                }

                updateElevatorDirection(elevator, floor);

                if (floor != null) {
                    elevator.goToFloor(floor.floorNum());

                    floor._.utime = NIL;
                    floor._.dtime = NIL;
                }
            });

            elevator.on('passing_floor', function(floorNum, direction) {
                if (elevator.loadFactor() > 0.7) {
                    return;
                }

                if (direction == 'down') {
                    if (floors[floorNum]._.dtime != NIL) {
                        elevator.goToFloor(floorNum, true);
                    }
                } else {
                    if (floors[floorNum]._.utime != NIL) {
                        elevator.goToFloor(floorNum, true);
                    }
                }
            });

            elevator.on('floor_button_pressed', function(floorNum) {
                updateElevatorDirection(elevator, floors[floorNum]);

                if (_.contains(elevator.destinationQueue, floorNum)) {
                    return;
                }

                elevator.destinationQueue.push(floorNum);

                if (elevator.goingUpIndicator()) {
                    sortFunction = function(floorNum) { return floorNum; };
                } else {
                    sortFunction = function(floorNum) { return 100 - floorNum; };
                }

                elevator.destinationQueue = _.sortBy(elevator.destinationQueue, sortFunction);
                elevator.checkDestinationQueue();

                if (elevator.goingUpIndicator()) {
                    console.log('Going Up:', elevator.destinationQueue);
                } else {
                    console.log('Going Down:', elevator.destinationQueue);
                }
            });

            elevator.on('stopped_at_floor', function(floorNum) {
                floor = floors[floorNum];

                if (elevator.goingUpIndicator()) {
                    floor._.utime = NIL;
                } else {
                    floor._.dtime = NIL;
                }

                if (elevator.destinationQueue.length == 0) {
                    updateElevatorDirection(elevator, null);

                    floor._.utime = NIL;
                    floor._.dtime = NIL;
                }
            });
        });
    },
    update: function(dt, elevators, floors) {
    }
}