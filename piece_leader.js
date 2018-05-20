/*
Leader indicates the leader of a unit. The leader can be attached to another Unit or at an actual grid coordinate
 */
var Leader = /** @class */ (function () {
    function Leader() {
        this.piece_type = PieceType.Leader;
    }
    Leader.prototype.copy = function () {
        var copied = new Leader();
        copied.coordinates = this.coordinates;
        copied.piece_type = this.piece_type;
        copied.id = this.id;
        copied.type = this.type;
        copied.leader_of = [];
        for (var _i = 0, _a = this.leader_of; _i < _a.length; _i++) {
            var unit = _a[_i];
            copied.leader_of.push(unit.copy());
        }
        copied.attached_to = this.attached_to.copy();
        return copied;
    };
    return Leader;
}());
// var a = new Leader();
// a.coordinates = [1, 3];
// var b = a.copy();
// b.coordinates = [2, 3];
//
// console.log(a.coordinates);
// console.log(b.coordinates);
//# sourceMappingURL=piece_leader.js.map