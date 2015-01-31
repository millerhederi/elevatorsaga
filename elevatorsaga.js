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

        getClosestFloor = function(floors, currentFloorNumber) {
            closestFloor = null;

            _.each(floors, function(floor) {
                if (closestFloor == null || Math.abs(floor.floorNum() - currentFloorNumber) < Math.abs(closestFloor.floorNum() - currentFloorNumber)) {
                    closestFloor = floor;
                }
            });

            return closestFloor;
        }

        getFloorsBetween = function(currentFloor, targetFloor) {

        }

        _.each(elevators, function(elevator) {
            elevator._ = {};

            elevator.on('idle', function() {
                console.log('BEGIN IDLE');

                floor = getClosestFloor(_.map(elevator.getPressedFloors(), function(i) { return floors[i]; }), elevator.currentFloor());

                if (floor == null) {
                    floorsPendingProcessing = _.filter(floors, function(floor) { return floor._.utime != NIL || floor._.dtime != NIL });
                    floor = getClosestFloor(floorsPendingProcessing, elevator.currentFloor());;
                }

                if (floor == null) {
                    floor = floors[0];
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