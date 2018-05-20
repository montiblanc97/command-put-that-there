/*
Leader indicates the leader of a unit. The leader can be attached to another Unit or at an actual grid coordinate
 */

class Leader implements Piece {
    coordinates: number[];
    piece_type: PieceType = PieceType.Leader;
    id: number;
    name: String;

    // Leader attributes
    type: UnitSize;
    leader_of: Unit[];
    attached_to: Unit;

    copy() {
        let copied = new Leader();

        copied.coordinates = this.coordinates;
        copied.piece_type = this.piece_type;
        copied.id = this.id;

        copied.type = this.type;
        copied.leader_of = [];
        for (let unit of this.leader_of) {
            copied.leader_of.push(unit.copy())
        }
        copied.attached_to = this.attached_to.copy();

        return copied;
    }
}

// var a = new Leader();
// a.coordinates = [1, 3];
// var b = a.copy();
// b.coordinates = [2, 3];
//
// console.log(a.coordinates);
// console.log(b.coordinates);
