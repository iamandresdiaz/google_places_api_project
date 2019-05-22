import { EventEmitter } from 'events';

class PlacesSearchByCategoryView extends EventEmitter {
    constructor({ element }){
        super();
        this._element = element;
    }

    start(){
        this._setupPlacesSearch();
    }

    _setupPlacesSearch() {
        const searchCategories = this._element.getElementsByClassName('list-group-item');
        Array.from(searchCategories).forEach(category => {
            category.addEventListener('click', (event) => {
                event.preventDefault();
                const categoryId = event.currentTarget.getAttribute('category-id');
                this.emit('categorySelected', categoryId);
            });
        });
    }
}

export default PlacesSearchByCategoryView;