export interface IItemLot {
    item: string;
    quantity: number;
    expiry: number | null;
}

class ItemLot implements IItemLot {

    public item: string;
    public quantity: number;
    public expiry: number | null;

    constructor(name: string, quantity: number, expiry: number | null) {
        this.item = name;
        this.quantity = quantity;
        this.expiry = expiry;
    }
}

export default ItemLot;
