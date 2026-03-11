class Board {
    width;
    height;
    arr;

    constructor(width, height, arr) {
        this.width = width;
        this.height = height;
        this.arr = arr;
    }

    /**
     * Moves a piece from one position to another.
     * @param {*} oldPos The current position of the piece to move.
     * @param {*} newPos The position to move the piece to.
     */
    movePiece(oldPos, newPos) {
        let piece = this.arr[oldPos.y][oldPos.x];
        this.arr[oldPos.y][oldPos.x] = null;
        this.arr[newPos.y][newPos.y] = piece;

        updateBoard(oldPos, newPos);
    }
}

class Piece {
    type;
    color;

    hasMoved = false;

    constructor(color, type) {
        this.type = type;
        this.color = color;
    }
}

const chessBoard = document.getElementById('board_body');

var movingPiece = null;

const BASIC_BOARD = new Board(8, 8,[
    [new Piece('black', 'rook'), new Piece('black', 'knight'), new Piece('black', 'bishop'), new Piece('black', 'queen'), new Piece('black', 'king'), new Piece('black', 'bishop'), new Piece('black', 'knight'), new Piece('black', 'rook')],
    [new Piece('black', 'pawn'), new Piece('black', 'pawn'), new Piece('black', 'pawn'), new Piece('black', 'pawn'), new Piece('black', 'pawn'), new Piece('black', 'pawn'), new Piece('black', 'pawn'), new Piece('black', 'pawn')],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [new Piece('white', 'pawn'), new Piece('white', 'pawn'), new Piece('white', 'pawn'), new Piece('white', 'pawn'), new Piece('white', 'pawn'), new Piece('white', 'pawn'), new Piece('white', 'pawn'), new Piece('white', 'pawn')],
    [new Piece('white', 'rook'), new Piece('white', 'knight'), new Piece('white', 'bishop'), new Piece('white', 'queen'), new Piece('white', 'king'), new Piece('white', 'bishop'), new Piece('white', 'knight'), new Piece('white', 'rook')],
]);

const board = BASIC_BOARD
generateBoard(board);

let test = document.getElementById('5-6').firstChild;

function generateBoard(board) {
    for (let i = 0; i < board.height; i++) {
        let row = chessBoard.insertRow(-1);

        for (let j = 0; j < board.width; j++) {
            let cell = row.insertCell(-1);
            cell.id = `${j}-${i}`;
            setPiece(cell, board.arr[i][j]);
        }
    } 
}

function updateBoard(oldSpace, newSpace) {
    const oldCell = document.getElementById(`${oldSpace.x}-${oldSpace.y}`);
    const newCell = document.getElementById(`${newSpace.x}-${newSpace.y}`);
    
    newCell.replaceChildren(oldCell.firstChild);
    oldCell.replaceChildren();
}

function setPiece(cell, piece) {
    if (piece !== null) {
        let imgPiece = document.createElement("img");   
        imgPiece.src = `/img/chess/${piece.color}_${piece.type}.svg`
        imgPiece.addEventListener("click", (e) => {
            clearMovableSpaces();

            var pos = getCellPos(e.currentTarget.parentNode);

            let piece = board.arr[pos.y][pos.x];

            colorMoveSpaces(getMoveSpaces(piece, pos.x, pos.y));
            
            let movableSpaces = document.getElementsByClassName('movable-space');
            for (let space of movableSpaces) {
                space.addEventListener('click', (e) => {
                    board.movePiece(pos, getCellPos(e.currentTarget));
                    
                    clearMovableSpaces();
                });   
            }
        });
        cell.appendChild(imgPiece);
    } else {
        cell.classList.add("empty-cell");
    } 
}

function getMoveSpaces(piece, x, y) {
    let spaces = [];
    switch (piece.type) {
        case 'pawn':
            let colorMod = piece.color === 'white' ? -1 : 1; //

            let nextRow = y + 1 * colorMod;

            if ((nextRow) in board.arr) {

            if (!piece.hasMoved) {
                spaces.push({x: x, y: y + 2 * colorMod});
            }
            
                if (board.arr[nextRow][x] === null) {
                    spaces.push({x: x, y: nextRow});
            }

                if ((x + 1 < board.width) && (board.arr[nextRow][x + 1] !== null)) {
                    if (board.arr[nextRow][x - 1].color != piece.color) {
                        spaces.push({x: x + 1, y: nextRow});
                    }
                }

                if ((x - 1 > 0) && ((board.arr[nextRow][x - 1] !== null))) { 
                    if (board.arr[nextRow][x - 1].color != piece.color) {
                        spaces.push({x: x - 1, y: nextRow});
                    }
                }
            }
            break;
    }

    return spaces;
}

function colorMoveSpaces(spaces) {
    for (let space of spaces) {
        let cell = document.getElementById(`${space.x}-${space.y}`);
        cell.classList.add('movable-space');
    }
}

function getCellPos(cell) {
    let pos = {x: cell.cellIndex, y: cell.parentNode.rowIndex};
    console.log(`X: ${pos.x} Y: ${pos.y}`);

    return pos;
}

function makePos(x, y) {
    return {x: x, y: y};
}

function clearMovableSpaces() {
    let movableSpaces = document.getElementsByClassName('movable-space');

    for (let i = movableSpaces.length - 1; i >= 0; i--) {
        movableSpaces[i].classList.remove('movable-space');
    }
}