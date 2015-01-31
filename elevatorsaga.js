{
    init: function(elevators, floors) {
        NIL = Number.MAX_SAFE_INTEGER;

        minIndex = function(array) {
            index = 0;
            for (var i = 1; i < array.length; i++) {
                if (array[i] < array[index]) {
                    index = i;
                }
            }

            if (array[index] == NIL) {
                return {index: -1, value: NIL};
            }

            return {index: index, value: array[i]};
        };
        
        up_times = [];
        down_times = [];

        _.each(floors, function(floor) {
            up_times.push(NIL);
            down_times.push(NIL);

            floor.on('up_button_pressed', function() {
                up_times[floor.floorNum()] = Date.now();
            });

            floor.on('down_button_pressed', function() {
                down_times[floor.floorNum()] = Date.now();
            });
        });

        _.each(elevators, function(elevator) {
            elevator.on('idle', function() {
                udata = minIndex(up_times);
                ufloor = udata.index;
                utime = udata.value;

                ddata = minIndex(down_times);
                dfloor = ddata.index;
                dtime = ddata.value;

                floor = 0;
                if (ufloor != -1 || dfloor != -1) {
                    if (utime < dtime) {
                        floor = ufloor;
                        up_times[ufloor] = NIL;
                    }
                    else {
                        floor = dfloor;
                        down_times[dfloor] = NIL;
                    }
                }

                elevator.goToFloor(floor);
            });
        });
    },
    update: function(dt, elevators, floors) {
    }
}