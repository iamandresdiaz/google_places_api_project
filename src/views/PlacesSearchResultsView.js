import { EventEmitter } from 'events';
import htmlToElement from '../utils/htmlToElement';
import ratingToStars from '../utils/ratingToStars';
import GOOGLE_KEY from '../utils/googlekey';

class PlacesSearchResultsView extends EventEmitter {
    constructor({ element }){
        super();
        this._element = element;
        this._KEY = GOOGLE_KEY;
    }

    start(){
        this._setupTitleLinks();
    }

    reset(placesResults){
        if (typeof placesResults === "undefined"){
            this._element.innerHTML = '';
        } else {
            this._element.innerHTML = '';
            placesResults = this._transformPlacesApiResults(placesResults);
            placesResults.forEach(placeResult => this._element.appendChild(renderResults(placeResult)));
        }
    }

    _setupTitleLinks(){
        const placeResultsContainers = this._element.getElementsByClassName('result');
        Array.from(placeResultsContainers).forEach(placeResult => {
            const placeTitle = placeResult.querySelector('h4.card-title a');
            placeTitle.addEventListener('click', (event) => {
                event.preventDefault();
                const placeId = placeResult.id;
                this.emit('placeSelected', placeId);
            });
        });
    }

    _transformPlacesApiResults(apiPlacesResponse) {
        const placesResults = [];
        for(const placeResult of apiPlacesResponse.results) {
            placesResults.push({
                placeId: placeResult.place_id,
                photoUrl: this._extractPhotoUrl(placeResult.photos),
                name: placeResult.name,
                address: placeResult.vicinity,
                rating: placeResult.rating
            });
        }
        return placesResults;
    }

    _extractPhotoUrl(photos){
        let photoUrl = '';

        if (photos === undefined) {
            photoUrl = 'http://placehold.it/700x400';
            return photoUrl;
        } else {
            photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxheight=700&photoreference=${photos[0].photo_reference}&key=${this._KEY}`;
            return photoUrl;
        }
    }
}

function renderStars(placeRating) {
    return ratingToStars(placeRating);
}

function renderResults(placesResults) {
    return htmlToElement(`
        <div class="result col-lg-4 col-md-6 mb-4" id="${placesResults.placeId}">
            <div class="card h-100">
                <a href="#"><img class="card-img-top" src="${placesResults.photoUrl}" alt=""></a>
                <div class="card-body">
                    <h4 class="card-title">
                        <a href="#">${placesResults.name}</a>
                    </h4>
                    <p><strong>${placesResults.address}</strong></p>
                </div>
                <div class="card-footer">
                    <small class="text-warning">${renderStars(placesResults.rating)}</small>
                </div>
            </div>
        </div>
    `);
}

export default PlacesSearchResultsView;