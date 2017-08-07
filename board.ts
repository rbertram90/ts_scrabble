interface Board {
    
}

class Board {
    
    public game: Game = null;
    /*
        squares
        0 = standard (no bonus)
        1 = double letter
        2 = triple letter
        3 = double word
        4 = triple word
        5 = start?
    */
    public static bonuses: number[][] = [
        [4,0,0,1,0,0,0,4,0,0,0,1,0,0,4],
        [0,3,0,0,0,2,0,0,0,2,0,0,0,3,0],
        [0,0,3,0,0,0,1,0,1,0,0,0,3,0,0],
        [1,0,0,3,0,0,0,1,0,0,0,3,0,0,1],
        [0,0,0,0,3,0,0,0,0,0,3,0,0,0,0],
        [0,2,0,0,0,2,0,0,0,2,0,0,0,2,0],
        [0,0,1,0,0,0,1,0,1,0,0,0,1,0,0],
        [4,0,0,1,0,0,0,3,0,0,0,1,0,0,4],
        [0,0,1,0,0,0,1,0,1,0,0,0,1,0,0],
        [0,2,0,0,0,2,0,0,0,2,0,0,0,2,0],
        [0,0,0,0,3,0,0,0,0,0,3,0,0,0,0],
        [1,0,0,3,0,0,0,1,0,0,0,3,0,0,1],
        [0,0,3,0,0,0,1,0,1,0,0,0,3,0,0],
        [0,3,0,0,0,2,0,0,0,2,0,0,0,3,0],
        [4,0,0,1,0,0,0,4,0,0,0,1,0,0,4]
    ];
    
    public squares: Square[][] = [];
    
    public constructor() {
        this.createSquares();        
    }
    
    public createSquares() {
        
        let row: number;
        let column : number;
        let rowData: Square[];
        let newSquare: Square;
        
        for(row = 0; row < 15; row++) {
            rowData = [];
            
            for(column = 0; column < 15; column++) {
                newSquare = new Square(row, column);
                newSquare.board = this;
                rowData.push(newSquare);
            }
            
            this.squares.push(rowData);
        }
        
    }
    
    public html(): string {
        
        let boardView: string = "";
        let row: number;
        let column : number;
        let currentSquare: Square;
        
        for(row = 0; row < 15; row++) {
            for(column = 0; column < 15; column++) {
                currentSquare = this.squares[row][column];
                boardView += currentSquare.html();
            }
        }
        
        return '<div class="board">' + boardView + '</div>';
    }
}

class Square {
    
    readonly id: string;
    readonly bonus: number;
    readonly row: number;
    readonly column: number;
    public board: Board = null;
    public tile: LetterTile = null;
    
    public constructor(row, column) {
        this.id = 'sq-' + row + '-' + column;
        this.row = row;
        this.column = column;
        this.bonus = Board.bonuses[row][column];
    }
    
    public static allowDrop(ev) {
        if(ev.target.childNodes.length == 0) {
            ev.preventDefault();
        }
    }

    public static drop(ev) {
        ev.preventDefault();
        let data: string = ev.dataTransfer.getData("text");
        ev.target.appendChild(document.getElementById(data));
        
        let squareIndex: Array<any> = ev.target.id.split("-");
        let targetSquare: Square = (<any>window).scrabble.board.squares[squareIndex[1]][squareIndex[2]];
        
        let currentPlayer: Player = (<any>window).scrabble.getCurrentPlayer();
        let tileIndex: number = 0;
        
        for(;tileIndex < currentPlayer.letters.length; tileIndex++) {
            if(currentPlayer.letters[tileIndex].id == parseInt(data)) {
                let droppedTile: LetterTile = currentPlayer.letters[tileIndex];
                
                if(droppedTile.square != null) {
                    droppedTile.square.tile = null; // clear old square
                }
                
                targetSquare.tile = droppedTile;
                droppedTile.square = targetSquare;
                droppedTile.status = 2; // Mark as being played but not locked
                
                // currentPlayer.removeLetterTile(tileIndex);
                break;
            }
        }
    }
    
    public html(): string {
        
        let bgcolour: number;
        let output: string;
        
        switch(this.bonus) {
            case 0: bgcolour = Colour.Grey; break;
            case 1: bgcolour = Colour.LightBlue; break;
            case 2: bgcolour = Colour.DarkBlue; break;
            case 3: bgcolour = Colour.Pink; break;
            case 4: bgcolour = Colour.Red; break;
            case 5: bgcolour = Colour.Yellow; break;
        }
        
        output = '<div id="' + this.id + '" class="square" ondrop="Square.drop(event)" ondragover="Square.allowDrop(event)" style="background-color:' + colours[bgcolour] + '">';
        
        if(this.tile != null) output += this.tile.html();
        
        output += '</div>';
        
        return output;
    }
}