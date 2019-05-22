function ratingToStars(rating) {
    const truncRating = Math.trunc(rating);
    const starsTemplate = ['&#9734;', '&#9734;', '&#9734;', '&#9734;', '&#9734;'];

    if (truncRating > 0) {
        for (let index = 0; index < truncRating; index++) {
            starsTemplate[index] = '&#9733;';
        }
    }

    return starsTemplate.join(' ');
}

export default ratingToStars;