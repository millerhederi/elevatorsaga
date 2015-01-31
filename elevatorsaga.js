{
    init: function(elevators, floors) {
        NIL = Number.MAX_SAFE_INTEGER;

        getClosestFloorAbove = function(currentFloor) {
            for (var i = currentFloor + 1; i < floors.length; i++) {
                if (floors[i]._.utime != NIL || floors[i]._.dtime != nil) {
                    return i;
                }
            }

            return -1;
        };

        getClosestFloorBelow = function(currentFloor) {
            for (var i = currentFloor - 1; i > -1; i--) {
                if (floors[i]._.utime != NIL || floors[i]._.dtime != nil) {
                    return i;
                }
            }

            return -1;
        };

        getClosestFloor = function(currentFloor) {
            floorAbove = getClosestFloorAbove(currentFloor);
            floorBelow = getClosestFloorBelow(currentFloor);

            if (floorAbove == -1 && floorBelow == -1) {
                return { direction: 0, floor: currentFloor };
            }

            if (floorAbove == -1 && floorBelow != -1) {
                return { direction: -1, floor: floorBelow };
            }

            if (floorBelow == -1 && floorAbove != -1) {
                return { direction: 1, floor: floorAbove };
            }

            aboveDelta = floorAbove - currentFloor;
            belowDelta = currentFloor - floorBelow;

            if (aboveDelta < belowDelta) {
                return { direction: 1, floor: floorAbove };
            }

            return { direction: -1, floor: floorBelow };
        };

        updateDirectionIndicator = function(elevator) {
            elevator.goingDownIndicator(false);
            elevator.goingUpIndicator(false);

            if (elevator._.direction == 1) {
                elevator.goingUpIndicator(true);
            }

            if (elevator._.direction == -1) {
                elevator.goingDownIndicator(true);
            }
        };

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

        _.each(elevators, function(elevator) {
            elevator._ = {}
            elevator._.direction = 0;

            elevator.on('idle', function() {
                if (elevator._.direction == 0) {
                    closestFloorDto = getClosestFloor(elevator.currentFloor());

                    if (closestFloorDto.direction == 0) {
                        return;
                    }

                    elevator._.direction = closestFloorDto.direction;
                    updateDirectionIndicator(elevator);

                    elevator.goToFloor(closestFloorDto.floor);
                }
            });
        });
    },
    update: function(dt, elevators, floors) {
    }
}