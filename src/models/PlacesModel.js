
import request from '../utils/request';
import GOOGLE_KEY from '../utils/googlekey';

//host to resolve problem with CORS
const DEV_ENV = 'https://cors.io/?';
//const PROD_ENV  = '';

class PlacesModel {
    constructor(){
        this._KEY = GOOGLE_KEY;
        this._BASE_URL = `${DEV_ENV}https://maps.googleapis.com/maps/api/place`;
    }

    searchByText(searchText, callback){
        request({
            url: this._searchByPlace(searchText),
            callback
        });
    }

    searchByCategory(searchCategory, callback){
        request({
            url: this._searchByCategory(searchCategory),
            callback
        });
    }

    showPlaceInformation(placeId, callback){
        request({
            url: this._searchByPlaceId(placeId),
            callback
        });
    }

    _searchByPlace(place){
        return `${this._BASE_URL}/nearbysearch/json?location=41.390205,2.154007&radius=15000&keyword=${place}&key=${this._KEY}`;
    }

    _searchByCategory(category){
        return `${this._BASE_URL}/nearbysearch/json?location=41.390205,2.154007&radius=15000&type=${category}&key=${this._KEY}`;
    }

    _searchByPlaceId(placeId){
        return `${this._BASE_URL}/details/json?placeid=${placeId}&key=${this._KEY}`;
    }
}

export default PlacesModel;
