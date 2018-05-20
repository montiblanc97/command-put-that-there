/*
Pieces can be units, the leader, points (just a coordinate or an actual place like objective or objective rally point)

coordinates: x,y location of piece. Note this will be where the piece is centered on.
piece_type: classification oe piece, see PieceType for possible
id: integer shared uniquely by this piece and all copies

size of piece (for drawing arrows) to be handled in view

copy function
 */
interface Piece {
    coordinates: number[];
    piece_type: PieceType;
    id: number;
    name: String;

    copy()
}

enum PieceType {
    Unit,
    Place,
    Leader
}