var Movies = Ember.Application.create();

Movies.Router.map(function () {
    this.resource('movies', {
        path: "/"
    }, function () {
        this.route('movie', {
            path: "/movie/:movie_id"
        });
    });
});

Movies.MoviesRoute = Ember.Route.extend({
    model: function () {
        return this.store.find('movie');
    }
});

Movies.MoviesMovieRoute = Ember.Route.extend({
    model: function (movie) {
        return this.store.find('movie', movie.movie_id);
    },
    actions: {
        didTransition: function() {
            this.get('controller').send('findImage');
        }
    }
});

Movies.ApplicationStore = DS.Store.extend({
    adapter: DS.LSAdapter
});

function updateListText(count){
    if ( count > 0 ){
        $('#emptyList').html('');
    } else {
        $('#emptyList').html('Your Movie List is Empty!');
    }
}

Movies.Movie = DS.Model.extend({
    name: DS.attr('string'),
    value: DS.attr('string'),
    overview: DS.attr('string'),
    release_date: DS.attr('string'),
    adult: DS.attr('string'),
    vote_average: DS.attr('string'),
    runtime: DS.attr('string'),
    poster_path: DS.attr('string'),
      didDelete: function() {
        updateListText(this.store.all('movie').content.length);
      },
      didCreate: function() {
        updateListText(this.store.all('movie').content.length);
      }
});

Movies.ApplicationController = Ember.Controller.extend({   
    needs: ['moviesMovie'],
    selectedNoteBinding: 'controllers.moviesMovie.model',
    emptyList: '',
    
    init: function(){
        if ( this.store.all('movie').content.length > 0 ){
            this.set('emptyList','');
        } else {
            this.set('emptyList','Your Movie List is Empty!');
        }
    },
    
    actions: {
        addMovie: function () {
            var me = this;
            var input = $('#movie').val();
            var movieName = encodeURI(input);
       
            $.ajax({
                type: 'GET',
                url: 'http://api.themoviedb.org/3/search/movie?query=' + input + '&api_key=470fd2ec8853e25d2f8d86f685d2270e',
                jsonpCallback: 'testing',
                contentType: 'application/json',
                dataType: 'jsonp',
                success: function (json) {
                    var $res = $('#results');
                    var htmlFragment = '<div class="list-group">';
                    
                    for (var i = 0; i < json.results.length; i++) {
                        var addButton = '<i id="' + json.results[i].id + '" class="fa fa-plus-square pull-right add-button hand"></i>';
                        if ( me.store.hasRecordForId('movie',json.results[i].id) === true ) {
                            addButton = '';
                        }
                        
                        var imageHolder = '<br/><i class="fa fa-file-image-o" style="font-size: 100px;"></i>';
                        if  ( json.results[i].poster_path !== null ){
                            imageHolder = '<img src="http://d3gtl9l2a4fn1j.cloudfront.net/t/p/w185' + json.results[i].poster_path + '" style="width: 90px" />';   
                        }

                        htmlFragment += '<a href="#" class="list-group-item no-hand"><p style="float:left; margin-right: 5px;">'+imageHolder+'<p><p style="float:left; width: calc(100% - 125px)"><b id="movieTitle">' + json.results[i].original_title + '</b><br/>' + json.results[i].release_date + ' <br/> ' + json.results[i].vote_average + '/10 <br/> ' + addButton + ' </p><p style="clear:both;"></p>  </a>';
                        
                    }
                    htmlFragment += '</div>';

                    $res.html(htmlFragment);

                    $res.find('i').bind('click', function () {
                        var $me = $(this);
                        var id = $me.attr('id');

                        $.ajax({
                            type: 'GET',
                            url: 'http://api.themoviedb.org/3/movie/' + id + '?api_key=470fd2ec8853e25d2f8d86f685d2270e',

                            jsonpCallback: 'testing',
                            contentType: 'application/json',
                            dataType: 'jsonp',
                            success: function (json) {
                                var newRec = me.store.createRecord('movie');
                                newRec.set('id', id);
                                newRec.set('name', json.original_title);
                                newRec.set('value', id);
                                newRec.set('poster_path', json.poster_path);
                                newRec.set('overview', json.overview);
                                newRec.set('release_date', json.release_date);
                                newRec.set('runtime', json.runtime);
                                newRec.set('vote_average', json.vote_average);
                                newRec.set('adult', json.adult);
                                newRec.save();
                                
                                $me.remove();
                            },
                            error: function (e) {
                                console.log(e.message);
                            }

                        });

                        return false;
                    });
                },
                error: function (e) {
                    console.log(e.message);
                }
            });
        }
    }
});

Movies.MoviesController = Ember.ArrayController.extend({ 
    needs: ['moviesMovie'],
    selectedNoteBinding: 'controllers.moviesMovie.model',
    
    actions: {
        doDeleteMovie: function (movie) {
            this.store.deleteRecord(movie);
            movie.save();
                                        
            if (this.get('controllers.moviesMovie.model.id') === movie.get('id')) {
                this.transitionToRoute('movies');
            }

        }
    }
});

Movies.MoviesMovieController = Ember.ObjectController.extend({
    imageFound: false,
    
    actions: {    
        findImage: function(){
            if ( this.get('poster_path') === null ){
                this.set('imageFound', false);
            } else {
                this.set('imageFound', true);
            }
        }
    },
    
    imagePath: function () {
        if ( this.imageFound === false ){
            return '#';    
        } else {
            return 'http://d3gtl9l2a4fn1j.cloudfront.net/t/p/w185' + this.get('poster_path');
        }
    }.property('poster_path')
});
