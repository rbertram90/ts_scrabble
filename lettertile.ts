interface LetterTileInterface {
    readonly index: number;
    letter: string;
    readonly value: number;
    readonly status: number;
}

class LetterTile implements LetterTileInterface {
    
    readonly index: number; // A = 0, B = 1...
    public letter: string; // A,B,C...
    readonly value: number; // How many points it's worth
    public status: number;  // 0 = in bag, 1 = on player bench, 2 = in play (not locked), 3 = in play (locked)
    public id: number;
    public square: Square = null;
    
    public constructor(letterIndex: number) {
        this.index = letterIndex;
        this.letter = letterText[letterIndex];
        this.value = letterValues[letterIndex];
        this.status = 0;
        
        // console.log("Created " + this.letter + " value = " + this.value);
    }
    
    public html(): string {
        
        let html: string = '<div id="' + this.id + '" class="tile" data-value="' + this.value + '"';
        
        if(this.isDraggable()) html += ' draggable="true" ondragstart="LetterTile.drag(event)"';
        
        if(this.index == Letter.BLANK) html += '><span class="letterblank">' + this.letter + '</span></div>';
        else html += '>' + this.letter + '</div>';
        
        return html;
    }
    
    public getElement(): Element {
        return document.getElementById(this.id.toString());
    }
    
    public isDraggable(): boolean {
        return (this.status == 1 || this.status == 2);
    }
    
    
    public static drag(ev) {
        ev.dataTransfer.setData("text", ev.target.id);
    }
}