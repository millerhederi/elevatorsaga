{
    init: function(elevators, floors) {
        NIL = Number.MAX_SAFE_INTEGER;

        _.each(floors, function(floor) {
            floor._ = {};
            floor._.utime = NIL;
            floor._.dtime = NIL;

            floor.on('up_button_pressed', function() {
                floor._.utime = Date.now();
            });

            floor.on('down_button_pressed', function() {
                floor._.dtime = Date.now();
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
        }

        getInterruptFloor = function(currentFloor, targetFloor, floorsPendingProcessing) {
            if (targetFloor == null) {
                return null;
            }

            if (currentFloor.floorNum() < targetFloor.floorNum()) {
                selector = function(floor) { 
                    return floor._.utime != NIL && currentFloor.floorNum() < floor.floorNum() && targetFloor.floorNum() > floor.floorNum(); 
                };   
            } else {
                selector = function(floor) { 
                    return floor._.dtime != NIL  && currentFloor.floorNum() > floor.floorNum() && targetFloor.floorNum() < floor.floorNum();
                };
            }

            return getClosestFloor(_.filter(floorsPendingProcessing, selector), currentFloor);
        }

        _.each(elevators, function(elevator) {
            elevator._ = {};

            elevator.on('idle', function() {
                console.log('BEGIN IDLE');

                currentFloor = floors[elevator.currentFloor()]
                pressedFloors = _.map(elevator.getPressedFloors(), function(i) { return floors[i]; });
                floorsPendingProcessing = _.filter(floors, function(floor) { return floor._.utime != NIL || floor._.dtime != NIL });

                floor = getClosestFloor(pressedFloors, currentFloor);

                if (floor != null) {
                    interrupFloor = getInterruptFloor(currentFloor, floor, floorsPendingProcessing);

                    if (interrupFloor != null) {
                        floor = interrupFloor;
                    }
                }

                if (floor == null) {
                    floor = getClosestFloor(floorsPendingProcessing, currentFloor);
                }

                if (floor != null) {
                    floor._.utime = NIL;
                    floor._.dtime = NIL;
                    elevator.goToFloor(floor.floorNum());
                }
                console.log('END IDLE');
            });
        });
    },
    update: function(dt, elevators, floors) {
    }
}