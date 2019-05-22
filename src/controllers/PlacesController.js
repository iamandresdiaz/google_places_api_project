class PlacesController {
    constructor({ placesSearchBarView, placesSearchResultsView, placeDetailsView, placesSearchByCategoryView, placesModel }){
        this._placesSearchBarView = placesSearchBarView;
        this._placesSearchResultsView = placesSearchResultsView;
        this._placeDetailsView = placeDetailsView;
        this._placesSearchByCategoryView = placesSearchByCategoryView;
        this._placesModel = placesModel;
    }

    start() {
        this._setupPlacesSearchBarView();
        this._setupPlacesSearchResultsView();
        this._setupPlaceDetailsView();
        this._setupPlacesSearchByCategoryView();
    }

    _setupPlacesSearchBarView() {
        this._placesSearchBarView.reset();
        this._placesSearchBarView.on('search', (searchInputText) => this._onSearchPlace(searchInputText));
        this._placesSearchBarView.start();
    }

    _setupPlacesSearchResultsView() {
        this._placesSearchResultsView.reset();
        this._placesSearchResultsView.on('placeSelected', (placeId) => this._onClickPlaceTitle(placeId));
    }

    _setupPlaceDetailsView() {
        this._placeDetailsView.reset();
    }

    _setupPlacesSearchByCategoryView(){
        this._placesSearchByCategoryView.start();
        this._placesSearchByCategoryView.on('categorySelected', (categoryId) => this._onCategorySelected(categoryId));
    }

    _onSearchPlace(searchInputText) {
        if(!searchInputText.trim()) {
            return;
        }
                
        this._placesModel.searchByText(searchInputText, (error, apiPlacesResponse) => {
            if(error){
                console.log(error);
                return alert("The search couldn't be found");
            }

            this._placesSearchBarView.reset();
            this._placesSearchResultsView.reset(apiPlacesResponse);
            this._placesSearchResultsView.start();
        });
    }

    _onClickPlaceTitle(placeId){
        this._placesModel.showPlaceInformation(placeId, (error, apiPlacesResponse) => {
            if(error){
                console.log(error);
                return alert("Place couldn't be found");
            }

            this._placeDetailsView.reset(apiPlacesResponse);
        });
    }

    _onCategorySelected(categoryId){
        this._placesModel.searchByCategory(categoryId, (error, apiPlacesResponse) => {
            if(error){
                console.log(error);
                return alert("The search couldn't be found by category");
            }

            this._placesSearchResultsView.reset(apiPlacesResponse);
            this._placesSearchResultsView.start();
        });
    }
}

export default PlacesController;