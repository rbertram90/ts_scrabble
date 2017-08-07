class Player {
    
    readonly letters: LetterTile[] = [];
    public score: number = 0;
    
    public giveLetterTile(tile: LetterTile) {
        this.letters.push(tile);
        tile.status = 1;
    }
    
    public displayLetters(): string {
        let l: number = 0;
        let view: string = "";
        
        for(;l<this.letters.length;l++) {
            view += this.letters[l].html();
        }
        
        return '<div class="letterholder" ondrop="Player.drop(event)" ondragover="Player.allowDrop(event)">' + view + '</div>';
    }
    
    public static allowDrop(ev) {
        ev.preventDefault();
    }

    public getTileById(targetid: number): LetterTile {
        let t: number = 0;
        let lt: LetterTile = null;
        
        for(;t<this.letters.length;t++) {
            lt = this.letters[t];
            
            if(lt.id == targetid) return lt;
        }
        
        return null;
    }
    
    public static drop(ev) {
        ev.preventDefault();
        let data: string = ev.dataTransfer.getData("text");
        
        let currentPlayer: Player = (<any>window).scrabble.getCurrentPlayer();
        
        let tileId: number = parseInt(data);
        
        // get letter from ID
        let letter: LetterTile = currentPlayer.getTileById(tileId);
        
        if(letter.square != null) {
            letter.square.tile = null;
            letter.status = 1;
            letter.square = null;
        }
        
        if(ev.target.className == 'letterholder') {
            ev.target.appendChild(document.getElementById(data));
        }
        else {
            ev.target.parentElement.appendChild(document.getElementById(data));
        }
    }
    
    public removeLetterTile(tileIndex) {
        this.letters.splice(tileIndex, 1);
    }
}