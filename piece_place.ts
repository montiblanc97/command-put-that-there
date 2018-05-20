/*
Point indicates a point on the map or an actual place (objective, objective rally point)
type: of the point, see PointType
 */

class Place implements Piece{
    coordinates: number[];
    piece_type: PieceType = PieceType.Place;
    id: number;
    name: String;

    // Place attributes
    type: PlaceType;

    copy() {
        let copied = new Place();

        copied.coordinates = this.coordinates;
        copied.piece_type = this.piece_type;
        copied.id = this.id;

        copied.type = this.type;

        return copied;
    }
}

enum PlaceType {
    Point,
    Objective,
    ORP
}

// var c = new Place();
// c.coordinates = [10, 9];
// var d = c.copy();
// d.coordinates = [8, 5];
//
// console.log(c.coordinates);
// console.log(d.coordinates);