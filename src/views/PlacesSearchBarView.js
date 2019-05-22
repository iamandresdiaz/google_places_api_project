import { EventEmitter } from 'events';

class PlacesSearchBarView extends EventEmitter {
    constructor({ element }){
        super();
        this._element = element;
    }

    start(){
        this._setupPlacesSearch();
    }

    reset(){
        const input = this._element.querySelector('[type="search"]');
        input.value = '';
    }

    _setupPlacesSearch() {
        this._element.addEventListener('submit', (event) => {
            event.preventDefault();

            const input = this._element.querySelector('[type="search"]');
            const searchInputText = input.value;

            this.emit('search', searchInputText);
        });
    }
}

export default PlacesSearchBarView;