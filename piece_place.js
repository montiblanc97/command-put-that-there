/*
Point indicates a point on the map or an actual place (objective, objective rally point)
type: of the point, see PointType
 */
var Place = /** @class */ (function () {
    function Place() {
        this.piece_type = PieceType.Place;
    }
    Place.prototype.copy = function () {
        var copied = new Place();
        copied.coordinates = this.coordinates;
        copied.piece_type = this.piece_type;
        copied.id = this.id;
        copied.type = this.type;
        return copied;
    };
    return Place;
}());
var PlaceType;
(function (PlaceType) {
    PlaceType[PlaceType["Point"] = 0] = "Point";
    PlaceType[PlaceType["Objective"] = 1] = "Objective";
    PlaceType[PlaceType["ORP"] = 2] = "ORP";
})(PlaceType || (PlaceType = {}));
// var c = new Place();
// c.coordinates = [10, 9];
// var d = c.copy();
// d.coordinates = [8, 5];
//
// console.log(c.coordinates);
// console.log(d.coordinates); 
//# sourceMappingURL=piece_place.js.map