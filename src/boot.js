import PlacesSearchBarView from './views/PlacesSearchBarView';
import PlacesSearchResultsView from './views/PlacesSearchResultsView';
import PlaceDetailsView from './views/PlaceDetailsView';
import PlacesSearchByCategoryView from './views/PlacesSearchByCategoryView';
import PlacesController from './controllers/PlacesController';
import PlacesModel from './models/PlacesModel';

const searchBar = document.getElementById('search-bar-form');
const placesSearchBarView = new PlacesSearchBarView({ element: searchBar });

const resultsSection = document.getElementById('results-section');
const placesSearchResultsView = new PlacesSearchResultsView({ element: resultsSection});

const placeDetailsSection = document.getElementById('place-details-section');
const placeDetailsView = new PlaceDetailsView({element: placeDetailsSection});

const searchCategories = document.getElementById('search-categories');
const placesSearchByCategoryView = new PlacesSearchByCategoryView({element: searchCategories});

const placesModel = new PlacesModel();

const placesController = new PlacesController({
    placesSearchBarView,
    placesSearchResultsView,
    placeDetailsView,
    placesSearchByCategoryView,
    placesModel
});

placesController.start();