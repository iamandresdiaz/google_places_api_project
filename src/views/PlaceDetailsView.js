import { EventEmitter } from 'events';
import htmlToElement from '../utils/htmlToElement';
import ratingToStars from '../utils/ratingToStars';
import GOOGLE_KEY from '../utils/googlekey';

class PlaceDetailsView extends EventEmitter {
    constructor({ element }){
        super();
        this._element = element;
        this._KEY = GOOGLE_KEY;
    }

    reset(placeInformation){
        if (typeof placeInformation === "undefined"){
            this._element.innerHTML = '';
        } else{
            this._element.innerHTML = '';
            placeInformation = this._transformPlacesApiResults(placeInformation);
            this._element.appendChild(renderDetails(placeInformation));
        }
    }

    _transformPlacesApiResults(placeInformation) {

        const placeInfo = placeInformation.result;

        return {
            photoUrl: this._extractPhotoUrl(placeInfo.photos),
            name: placeInfo.name,
            address: placeInfo.formatted_address,
            rating: placeInfo.rating,
            phoneNumber: placeInfo.formatted_phone_number,
            website: placeInfo.website,
            status: placeInfo.opening_hours.open_now,
            reviews: placeInfo.reviews
        };

    }

    _extractPhotoUrl(photos){
        let photoUrl = '';

        if (photos === undefined) {
            photoUrl = 'http://placehold.it/900x400';
            return photoUrl;
        } else {
            photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxheight=400&photoreference=${photos[0].photo_reference}&key=${this._KEY}`;
            return photoUrl;
        }
    }
}

function renderStars(placeRating) {
    return ratingToStars(placeRating);
}

function renderDate(time) {
    const date = new Date(1970, 0, 1);
    date.setSeconds(time);

    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function renderReviews(reviews = []) {
    let reviewsInHtml = ``;

    reviews.forEach(review => {
        reviewsInHtml = reviewsInHtml + `
            <span class="text-warning">${renderStars(review.rating)}</span> ${review.rating} stars
            <p>${review.text}</p>
            <small class="text-muted">Posted by ${review.author_name} on ${renderDate(review.time)}</small>
            <hr>
        `;
    });

    return reviewsInHtml;
}

function renderDetails(placeDetails) {
    return htmlToElement(`
        <div>
            <h2 class="my-4">Place details</h2>
            <div class="card mt-4">
              <img class="card-img-top img-fluid" src="${placeDetails.photoUrl}" alt="">
              <div class="card-body">
                <div><h3 class="card-title">${placeDetails.name}</h3> 
                <span class="text-warning" style="float:right;">${renderStars(placeDetails.rating)}</span>
            </div>
                <p>
                  <strong>${typeof placeDetails.address === "undefined" ? 'address not available' : placeDetails.address}</strong>
                </p>
                  <ul>
                    <li>${typeof placeDetails.phoneNumber === "undefined" ? 'phone not available' : placeDetails.phoneNumber}</li>
                    <li>${placeDetails.status ? "<span class='text-success'>Open</span>" : "<span class='text-danger'>Closed</span>"}</li>
                    <li><a href="${placeDetails.website}">${typeof placeDetails.website === "undefined" ? 'website not available' : placeDetails.website}</a></li>
                  </ul>
                
              </div>
            </div>
    
            <div class="card card-outline-secondary my-4">
              <div class="card-header">
                Place Reviews
              </div>
              <div class="card-body">
                ${renderReviews(placeDetails.reviews)}
              </div>
            </div>
        </div>
    `);
}

export default PlaceDetailsView;