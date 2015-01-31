{
    init: function(elevators, floors) {
        NIL = Number.MAX_SAFE_INTEGER;

        getClosestFloorAbove = function(currentFloor) {
            for (var i = currentFloor + 1; i < floors.length; i++) {
                if (floors[i]._.utime != NIL || floors[i]._.dtime != NIL) {
                    return i;
                }
            }

            return -1;
        };

        getClosestFloorBelow = function(currentFloor) {
            for (var i = currentFloor - 1; i > -1; i--) {
                if (floors[i]._.utime != NIL || floors[i]._.dtime != NIL) {
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

            elevator.on('idle', function() {
                pressedFloors = elevator.getPressedFloors();

                console.log('---');
                console.log('Pressed: ', pressedFloors);
                console.log('Waiting:', 
                    _.map(
                        _.where(floors, function(floor) { floor._.utime != NIL || floor._.dtime != NIL}),
                        function(floor) { return floor.floorNum(); }));

                if (pressedFloors.length > 0) {
                    optimalFloor = pressedFloors[0];
                    optimalDelta = Math.abs(optimalFloor - elevator.currentFloor());

                    _.each(pressedFloors, function(floor) {
                        delta = Math.abs(floor - elevator.currentFloor());

                        if (delta < optimalDelta) {
                            optimalDelta = delta;
                            optimalFloor = floor;
                        }
                    });

                    elevator.goToFloor(optimalFloor);
                    floors[optimalFloor]._.utime = NIL;
                    floors[optimalFloor]._.dtime = NIL;
                }
                else {
                    closestFloorDto = getClosestFloor(elevator.currentFloor());

                    if (closestFloorDto.direction == 0) {
                        return;
                    }

                    elevator.goToFloor(closestFloorDto.floor);
                    floors[closestFloorDto.floor]._.utime = NIL;
                    floors[closestFloorDto.floor]._.dtime = NIL;
                }
            });
        });
    },
    update: function(dt, elevators, floors) {
    }
}