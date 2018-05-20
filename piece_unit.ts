/*
Unit indicates a force
friendly: whether or not the force is friendly versus enemy
size: of the unit e.g. Platoon see UnitSize
 */

class Unit implements Piece{
    coordinates: number[];
    piece_type: PieceType = PieceType.Unit;
    id: number;
    name: String;

    // Unit attributes
    friendly: boolean;
    size: UnitSize;

    copy() {
        let copied = new Unit();

        copied.coordinates = this.coordinates;
        copied.piece_type = this.piece_type;
        copied.id = this.id;

        copied.friendly = this.friendly;
        copied.size = this.size;
        copied.name = this.name;

        return copied;
    }
}

enum UnitSize {
    Squad,
    Platoon,
    Company,
    Battalion,
    Regiment,
    Brigade,
    Division
}

// var e = new Unit();
// e.coordinates = [1, 3];
// var f = e.copy();
// f.coordinates = [2, 3];
//
// console.log(e.coordinates);
// console.log(f.coordinates);