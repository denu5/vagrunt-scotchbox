(function () {
  // Modules
  angular.module('app', ['contentful','ui.router']);

  angular
    .module('app')
    .config(function (contentfulProvider) {
      contentfulProvider.setOptions({
        space: 'kdhh4ikczjzh',
        accessToken: 'dbb9cca8fd6275322f97fc196c3e64fb434e8ba64efa214bbf8ed4b4d3b1e8b6'
      });
    });
    
   // ------
 
  function productStockFactory($http) {

    var urlBase = 'https://www.urbanpeople.com';
    var dataFactory = {};
        
    dataFactory.getVariants = function (id) {
        //alert( 1);
        var c = angular.callbacks.counter.toString(36);
        console.log( urlBase + "/widget.php?cl=upstreetdealjsonp&callback=JSON_CALLBACK&oxid=" + id +"&counter=" + c);
        return  $http.jsonp(urlBase + "/widget.php?cl=upstreetdealjsonp&callback=JSON_CALLBACK&oxid=" + id +"&counter=" + c)
    };

    dataFactory.insertCustomer = function (cust) {
        return $http.post(urlBase, cust);
    };

    dataFactory.updateCustomer = function (cust) {
        return $http.put(urlBase + '/' + cust.ID, cust)
    };

    return dataFactory;
  }
   angular.module('app').factory('productStockFactory', productStockFactory);
 
 
  // ------
  function MenuCtrl($scope,  contentful) {
    
    var vm = this;

    var promise = contentful.entries('content_type=page&order=-fields.title');
   
    promise.then(function (response) {
      
    if(response.data && response.data.items && response.data.items.length){
      vm.pages = response.data.items;
    }
      
    });
  }
  angular.module('app').controller('MenuCtrl', MenuCtrl);
  
  // ------
  function PageCtrl($scope,  $rootScope, contentful, $stateParams) {
    
    var vm = this;
    if( $stateParams.slug ){
      var promise = contentful.entries('content_type=page&fields.slug=' + $stateParams.slug + '&limit=1');
      promise.then(function (response) {
        if(response.data && response.data.items && response.data.items.length){
          vm.page = response.data.items[0];
          console.log(vm.page);
        }
        
      });
    }
  }
  angular.module('app').controller('PageCtrl', PageCtrl);

  
  // ------ 
  function DealCtrl($scope,$state, $rootScope, contentful, $stateParams) {

    var vm = this;
    
    if($stateParams.deal=='latest' || !$stateParams.deal){
      vm.promise = contentful.entries('content_type=deal&order=-fields.dealdate&limit=1');
      $stateParams.deal = 'latest'; // set latest if coming empty from start
      
    }else{
      //TODO check ob $stateParams.deal ein date ist dann: edit -> seems to work 
      vm.promise = contentful.entries('content_type=deal&fields.dealdate='+$stateParams.deal+'&limit=1');
      //var promise = contentful.entries('content_type=deal&order=-fields.dealdate&limit=1');
    }
    
    vm.promise.then(function (response) {
    
      if(response.data && response.data.items && response.data.items.length){
        
        vm.deal = response.data.items[0];
        
        if( $stateParams.deal == 'latest'){
          vm.deal.fields.fakedate = 'latest';
        }else{
          //nice date without hyphen
          //vm.deal.fields.fakedate = vm.deal.fields.dealdate.replace('-', '');
          vm.deal.fields.fakedate = vm.deal.fields.dealdate;
        }
        //if mainarticle is set AND NOT article url param
        if(vm.deal.fields.mainarticle.sys.id && !$stateParams.articleid){
          $state.go('deal.detail', { 'deal': $stateParams.deal , 'articleid': vm.deal.fields.mainarticle.sys.id });
          //vm.loadArticle( vm.deal.fields.mainarticle.sys.id );
          //return; //break execution
        }
       
        vm.listing = {};
        vm.listing.imgwidth = 120;
        vm.listing.imgcount = vm.deal.fields.articles.length;
        vm.listing.widthpx = vm.listing.imgwidth * vm.listing.imgcount + 'px';
        
        
        //Deal Datum Check
        /*
        var entryDate = new Date( $scope.$dealEntry.fields.dealdate );
        var nowDate = new Date();
        if( entryDate.getTime() < nowDate.getTime() ){
          $scope.olddeal = true;
          console.log('schnee von gestern');
        }
        */
        
      }
    });
    
    
    //Load article init OR click event
    vm.loadArticle = function(articleId) {
      $state.go('deal.detail', { 'articleid': articleId });
      $rootScope.$emit('DealDetailCtrlReloadEvent', articleId);
    }
    
  
    
    //Triggers Controller Article Data Reload
    $rootScope.$on('setSelectedArticleId', function(event, id) { 
      vm.selectedArticleId = id;
    });
  }
  angular.module('app').controller('DealCtrl', DealCtrl);
  // ------
  

  function DealDetailCtrl($scope, $stateParams, $rootScope, $http, contentful, productStockFactory){
      
      var vm = this;
      
      vm.article = {};

      vm.setCartSelectVariant = function(variant) {
        //set false to variante selection
        for (var i = 0; i < vm.article.variants.length; i++) {
            vm.article.variants[i].selected = false;
        }
        
        if(variant.stock > 0){
          variant.selected = true;
          vm.article.aid = variant.oxid;
        }else{
          //notifcation
        }
      }
    
      vm.setActivePicture = function(num) {
        if( Object.keys( vm.article.fields.imagesJson.Pics ).length == num ){
          num = 1;
        }
      
        if( num == 0 ){
          num = Object.keys( vm.article.fields.imagesJson.Pics ).length;
        }
        
        vm.article.activePicture = {
            "num" : num,
            "regularPic" : vm.article.fields.imagesJson.Pics[num],
            "zoomPic" : vm.article.fields.imagesJson.ZoomPics[num].file
        };
      }
      
      vm.setNextPicture = function() {
        vm.setActivePicture(  vm.article.activePicture.num + 1 );
      }
      vm.setPrevPicture = function() {
        vm.setActivePicture(  vm.article.activePicture.num - 1 );
      }
      
      vm.stockHandler = function(id) {
        
        vm.article.stockloader = false;
       
        productStockFactory.getVariants(id)
        .success(function(data) {
          
          if( data.stock > 0 ){
             vm.article.isbuyable = true;
          }else{
            vm.article.isbuyable = false;
          }
          
          if( data.variants.length == 0){
            vm.article.aid = data.parentid;
          }else{
            vm.article.aid = false;
            vm.article.variants = data.variants;
          }

          vm.article.stockloader = true;
  			}).
  			error(function (res) {
  			    console.log( "Request failed" );
  			    vm.article.stockloader = false;
  			});
      }
      
      vm.toCartSubmit = function(e) {
        if( vm.article.aid && vm.article.isbuyable ){
          
        }else{
          e.preventDefault();
        }
       
      }
      
      vm.loadArticle = function(id) {
    
        var promise = contentful.entries('sys.id=' +id + '&limit=1');
        promise.then(function (response) {
          if(response.data && response.data.items && response.data.items.length){
          
            vm.article = {}; // reset data
            vm.article  = response.data.items[0]; // this is possible because its the first assigment..
            
            vm.stockHandler( vm.article.fields.oxid );
            vm.article.pricedrop = '-' + ( 100 - Math.round( vm.article.fields.price / vm.article.fields.oldprice * 100 ) ) +'%';
        
            vm.setActivePicture(1); 
            
            //var coundownEl = document.querySelector(".listing__horizontal");
            //alert( coundownEl.offsetTop );
            //document.body.scrollTop = coundownEl.offsetTop - 15;  //jump to top
            
            $rootScope.$emit('setSelectedArticleId', vm.article.sys.id);
          }
          // angular.element(document.querySelector("body")).css("background", "red") ;
        });
      }
      
      //this is some shaky stuff right here
      if( $stateParams.articleid ){
        vm.loadArticle( $stateParams.articleid );
      }
      
      //Triggers Controller Article Data Reload
      $rootScope.$on('DealDetailCtrlReloadEvent', function(event, id) { 
        vm.loadArticle(id);
      });

    }
    angular.module('app').controller('DealDetailCtrl', DealDetailCtrl);
    //------
    
    angular.module('app')
    .controller('DealStatusCtrl', function ($scope,  $rootScope, $http) {
        $scope.ctrlLoadStatus = false;
        
        $scope.$parent.dealVm.promise.then(function(){
          var date = $scope.$parent.dealVm.deal.fields.dealdate;
          
          var urlBase = 'https://www.urbanpeople.com';
          var c = angular.callbacks.counter.toString(36);
          
          console.log(urlBase + "/widget.php?cl=upstreetdealstatusbar&callback=JSON_CALLBACK&dealdate=" + date +"&counter=" + c);
          $http.jsonp(urlBase + "/widget.php?cl=upstreetdealstatusbar&callback=JSON_CALLBACK&dealdate=" + date +"&counter=" + c)
          .success(function(data) {
            $scope.csspercent = data.remaining;
            $scope.ctrlLoadStatus = true;
    			});
        });
     
    });
    
    
    angular	
  	.module('app').directive("status", function() {
    return {
      restrict: 'E',
      templateUrl: 'statusDirective.html',
      scope:{
      	dealdate : '=' //not using attr atm
      },
      transclude : false,
      controller: 'DealStatusCtrl'
    };
  });
    
  
  
    angular
    .module('app')
    .filter('html', ['$sce', function ($sce) { 
        return function (text) {
            return $sce.trustAsHtml(text);
    };    
    }]);
    
    
    angular.module('app')
    .filter('markdown', function ($sce) {
        var converter = new showdown.Converter();
        return function (value) {
    		var html = converter.makeHtml(value || '');
            return $sce.trustAsHtml(html);
        };
    });
    
    
    angular.module('app')
    .filter('titlesplit', function ($sce) {
        return function (value,num) {
          if(value){
      	    var title1 = value.split(' -');
            var title2 = title1[1].split(' (');
            var title3 = '(' + title2[1]; 
      	    
      	    if(num){
              return title1[num];
      	    }else{
      	      // split nach meinem schema, 
      	      var html = '<div>'+title1[0]+'</div>' + '<div>'+title2[0]+'</div>';    //+'<div>'+title3+'</div>';
      	             
      	      return $sce.trustAsHtml( html);
      	    }
          }
        };
    });
  
    angular
    .module('app')
    .config(function($stateProvider,  $urlRouterProvider, $locationProvider) {
    
   // $urlRouterProvider.otherwise('/');
   
    // pretty Angular URLs
	  $locationProvider.html5Mode(true);
	
    // any unknown URLS go to 404
    $urlRouterProvider.otherwise('/404');
    // no route goes to index
    //$urlRouterProvider.when('', '/latest');

    $stateProvider
    .state('layout', { template	: '<div ui-view></div>' })
    .state('home', {
      url: '/',
      /*views: { 
          '': { 
            //templateUrl: 'app/DealView.html'
            template: 'kacke'
          }
      },*/
      controller: function($state,  $stateParams){
        $state.go('deal', { 'deal': 'latest' });
      }
    })
    .state('page', {
      url: '/p/:slug',
      templateUrl: 'PageView.html'
    })
    .state('deal', {
      url: '/:deal',
      views: {
          '': {
            templateUrl: 'DealView.html',
          }
      },
      reload: true 
    })
    .state('deal.detail', {
        url: '/:articleid',
        views: { 
          'DealDetail@deal': {
            templateUrl: 'DealDetailView.html',
          }
        }
    });
        
});


  angular.module('app')
  .directive('countdown', [
        'Utils',
        '$interval',
        function (Utils, $interval) {
            return {
                restrict: 'E',
                scope: { date: '=' },
                link: function ($scope, element) {
                   
                    console.log( $scope.date);
                    
                    var future;
                    future = new Date($scope.date);
                    
                    future.setDate(future.getDate() + 1);
                    future.setHours(9);
                    
                    console.log(future);
                    
                    $interval(function () {
                        var diff;
                        diff = Math.floor((future.getTime() - new Date().getTime()) / 1000);
                        return element.text(Utils.dhms(diff));
                    }, 1000);
                }
            };
        }
    ])
    .factory('Utils', [function () {
            return {
                dhms: function (t) {
                  var days, hours, minutes, seconds;
                  days = Math.floor(t / 86400);
                  t -= days * 86400;
                  hours = Math.floor(t / 3600) % 24;
                  t -= hours * 3600;
                  minutes = Math.floor(t / 60) % 60;
                  t -= minutes * 60;
                  seconds = t % 60;
                  return [
                      //days + 'd',
                      this.zeroPad(hours,2) + ':',
                      this.zeroPad(minutes,2) + ':',
                      this.zeroPad(seconds,2) + ''
                  ].join('');
                },
                zeroPad: function(num, places) {
                  var zero = places - num.toString().length + 1;
                  return Array(+(zero > 0 && zero)).join("0") + num;
                }
            };
    }]);
    
 
   

})();