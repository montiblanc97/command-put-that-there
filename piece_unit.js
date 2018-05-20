/*
Unit indicates a force
friendly: whether or not the force is friendly versus enemy
size: of the unit e.g. Platoon see UnitSize
 */
var Unit = /** @class */ (function () {
    function Unit() {
        this.piece_type = PieceType.Unit;
    }
    Unit.prototype.copy = function () {
        var copied = new Unit();
        copied.coordinates = this.coordinates;
        copied.piece_type = this.piece_type;
        copied.id = this.id;
        copied.friendly = this.friendly;
        copied.size = this.size;
        copied.name = this.name;
        return copied;
    };
    return Unit;
}());
var UnitSize;
(function (UnitSize) {
    UnitSize[UnitSize["Squad"] = 0] = "Squad";
    UnitSize[UnitSize["Platoon"] = 1] = "Platoon";
    UnitSize[UnitSize["Company"] = 2] = "Company";
    UnitSize[UnitSize["Battalion"] = 3] = "Battalion";
    UnitSize[UnitSize["Regiment"] = 4] = "Regiment";
    UnitSize[UnitSize["Brigade"] = 5] = "Brigade";
    UnitSize[UnitSize["Division"] = 6] = "Division";
})(UnitSize || (UnitSize = {}));
// var e = new Unit();
// e.coordinates = [1, 3];
// var f = e.copy();
// f.coordinates = [2, 3];
//
// console.log(e.coordinates);
// console.log(f.coordinates); 
//# sourceMappingURL=piece_unit.js.map