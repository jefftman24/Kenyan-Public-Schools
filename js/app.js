(function(){

  // ####### MAPBOX PUBLIC ACCESS TOKEN #######
  L.mapbox.accessToken = 'pk.eyJ1IjoiamVmZnRtYW4iLCJhIjoiY2pka283eGRoMDBiczJxbXBuYTg3amxwbCJ9.yo50lwT35CjhWTHj6KLBLg';

  // ####### INSTANTIATE MAPBOX MAP & OPTIONS #######
  var map = L.mapbox.map('map', 'mapbox.light', {
      zoomSnap: 0.1,
      zoom: 6.5,
      minZoom: 6,
      maxZoom: 9,
      maxBounds: L.latLngBounds([-6.22, 27.72],[5.76, 47.83])
  });

  // ####### OMNIVORE CVS PARSED TO GEOJSON FEATURES VIA AJAX REQUEST #######
  omnivore.csv('data/kenya_education_2014.csv')
      // ####### CSV LOADING ERROR CATCHING CODE #######
      .on('ready', function(e) {
          drawMap(e.target.toGeoJSON());
          drawLegend(e.target.toGeoJSON());
      })
      .on('error', function(e) {
          console.log(e.error[0].message);
  });

  function drawMap(data) {
    // ####### ACCESS TO DATA HERE #######
      var options = {
          pointToLayer: function (feature, ll) {
              return L.circleMarker(ll, {
                  opacity: 1,
                  weight: 2,
                  fillOpacity: 0,
              })
          }
      }

      // ####### CREATE 2 SEPARATE LAYERS FROM THE GEOJSON DATA #######
      var girlsLayer = L.geoJson(data, options).addTo(map),
          boysLayer = L.geoJson(data, options).addTo(map);

          // ####### SET COLOR STYLE OF EACH LAYER (BOYS & GIRLS) #######
          girlsLayer.setStyle({
              color: '#D96D02',
          });
          boysLayer.setStyle({
              color: '#6E77B0',
          });

      // ####### FIT THE BOUNDS OF MAP TO ONE OF THE LAYERS #######
      map.fitBounds(boysLayer.getBounds());

      // ####### ADJUST ZOOM LEVEL OF THE MAP #######
      map.setZoom(map.getZoom() - 0.2);

      // ####### CALL resizeCircles FUNCTION #######
      resizeCircles(girlsLayer, boysLayer, 1);

      // ####### CALL sequenceUI FUNCTION #######
      sequenceUI(girlsLayer, boysLayer);

      // ####### CALL drawLegend FUNCTION #######
      drawLegend(data);

  } // ####### END drawMap FUNCTION #######


    // ####### CREATE CIRCLE BASED ON GRADE ATTRIBUTE #######
    function calcRadius(val) {

        var radius = Math.sqrt(val / Math.PI);
        return radius * .5; // ####### ADJUST RADIUS BY 0.5 AS A SCALE FACTOR #######

    } // ####### END calcRadius FUNCTION #######

    function resizeCircles(girlsLayer, boysLayer, currentGrade) {

        // ####### RESIZE CIRCLES FOR EACH LAYER (BOYS & GIRLS) #######
        girlsLayer.eachLayer(function (layer) {
            var radius = calcRadius(Number(layer.feature.properties['G' + currentGrade]));
            layer.setRadius(radius);
        });
        boysLayer.eachLayer(function (layer) {
            var radius = calcRadius(Number(layer.feature.properties['B' + currentGrade]));
            layer.setRadius(radius);
        });

        // ####### UPDATE THE HOVER WINDOW W/ CURRENT GRADE'S #######
        retrieveInfo(boysLayer, currentGrade);

    } // ####### END resizeCircles FUNCTION #######


    // ####### SEQUENCE THROUGH THE UI & LISTEN FOR USER CHANGE #######
    function sequenceUI(girlsLayer, boysLayer) {

      // ####### CREATE LEAFLET CONTROL FOR THE UI SLIDER #######
      var sliderControl = L.control({
          position: 'bottomleft'
      });

      sliderControl.onAdd = function(map) {
          // ####### SELECT THE UI SLIDER USING ID ATTRIBUITE OF UI SLIDER #######
          var controls = L.DomUtil.get("slider");

          // ####### DISABLE SCROLL & CLICK FUCTIONALITY #######
          L.DomEvent.disableScrollPropagation(controls);
          L.DomEvent.disableClickPropagation(controls);

          // ####### RETURN THE SELECTION #######
          return controls;

      }

      sliderControl.addTo(map);   // ####### ADD UI SLIDER TO MAP #######

      // ####### CREATE LEAFLET CONTROL FOR THE GRADE DIV #######
      var gradeControl = L.control({
          position: 'bottomleft'
      });

      gradeControl.onAdd = function(map) {
        // ####### SELECT THE GRADE DIV USING ID ATTRIBUITE OF GRADE DIV #######
        var grades = L.DomUtil.get("grade");

        // ####### DISABLE SCROLL & CLICK FUCTIONALITY #######
        L.DomEvent.disableScrollPropagation(grades);
        L.DomEvent.disableClickPropagation(grades);

        // ####### RETURN THE SELECTION #######
        return grades;

    }

    gradeControl.addTo(map);   // ####### ADD GRADE CONTROL TO MAP #######

      // ####### SELECT THE SLIDER'S INPUT & LISTEN FOR CHANGE #######
      $('#slider input[type=range]')
          .on('input', function () {

              // ####### CURRENT VALUE OF SLIDER IS CURRENT GRADE LEVEL #######
              var currentGrade = this.value;

              // ####### CALL resizeCircles() TO RESIZE CIRCLES W/ UPDATED GRADE LEVEL #######
              resizeCircles(girlsLayer, boysLayer, currentGrade);

              // ####### SELECT GRADE INPUT & UPDATE W/ THE CURRENTGRADE
              $('#grade span').html(currentGrade);
          });


    } // ####### END sequenceUI FUNCTION #######


    function drawLegend(data) {

      // ####### CREATE LEAFLET CONTROL FOR THE LEGEND #######
      var legendControl = L.control({
          position: 'bottomright'
      });

      // ####### WHEN THE CONTROL IS ADDED TO THE MAP #######
      legendControl.onAdd = function (map) {

        // ####### SELECT THE LEGEND USING ID ATTRIBUITE OF THE LEGEND #######
        var legend = L.DomUtil.get("legend");

        // ####### DISABLE SCROLL & CLICK FUCTIONALITY #######
        L.DomEvent.disableScrollPropagation(legend);
        L.DomEvent.disableClickPropagation(legend);

        // ####### RETURN THE SELECTION #######
        return legend;

      }

      // ####### LOOP THROUGH ALL FEATURES (THE SCHOOLS) #######
      var dataValues = data.features.map(function (school) {
          // ####### FOR EACH GRADE IN A SCHOOL #######
          for (var grade in school.properties) {
              // ####### SHORTHAND TO EACH VALUE #######
              var value = school.properties[grade];
              // ####### IF THE VALUE CAN BE CONVERTED TO A NUMBER #######
              if (+value) {
                  // ####### RETURN THE VALUE TO THE ARRAY #######
                  return +value;
              }

          }
      });
      // ####### VERIFY RESULTS #######
      console.log(dataValues);

      // ####### SORT THE ARRAY #######
      var sortedValues = dataValues.sort(function(a, b) {
          return b - a;
      });

      // ####### ROUND THE HIGHEST # & USE AS THE LARGE CIRCLE DIAMETER #######
      var maxValue = Math.round(sortedValues[0] / 1000) * 1000;

      // ####### CALCULATE THE DIAMETERS OF CIRCLES #######
      var largeDiameter = calcRadius(maxValue) * 2,
          smallDiameter = largeDiameter / 2;

      // ####### SELECT OUR CIRCLES CONTAINER & SET THE HEIGHT #######
      $(".legend-circles").css('height', largeDiameter.toFixed());

      // ####### SET WIDTH & HEIGHT FOR LARGE CIRCLE #######
      $('.legend-large').css({
          'width': largeDiameter.toFixed(),
          'height': largeDiameter.toFixed()
        });

      // ####### SET WIDTH & HEIGHT FOR SMALL CIRCLE & POSITION #######
      $('.legend-small').css({
          'width': smallDiameter.toFixed(),
          'height': smallDiameter.toFixed(),
          'top': largeDiameter - smallDiameter,
          'left': smallDiameter / 2
        })

        // ####### LABEL MAX & MEDIAN VALUE #######
        $(".legend-large-label").html(maxValue.toLocaleString());
        $(".legend-small-label").html((maxValue / 2).toLocaleString());

        // ####### ADJSUST THE POSITION OF LARGE (BASED ON SIZE OF CIRCLE) #######
        $(".legend-large-label").css({
            'top': -11,
            'left': largeDiameter + 30,
          });

        // ####### ADJSUST THE POSITION OF SMALL (BASED ON SIZE OF CIRCLE) #######
        $(".legend-small-label").css({
            'top': smallDiameter - 11,
            'left': largeDiameter + 30
          });

        // ####### INSERT A COUPLE HR ELEMENTS & USE TO CONNECT VALUE LABEL TO CIRCLES #######
        $("<hr class='large'>").insertBefore(".legend-large-label")
        $("<hr class='small'>").insertBefore(".legend-small-label").css('top', largeDiameter - smallDiameter - 8);

        legendControl.addTo(map);   // ####### ADD LEGEND TO MAP #######

    } // ####### END drawLegend FUNCTION #######


    function retrieveInfo(boysLayer, currentGrade) {

      // ####### SELECT THE ELEMENT & REFERENCE W/ VARIABLE & HIDE IT FROM INITIAL MAP #######
      var info = $('#info').hide();

      // ####### SINCE boysLayer IS ON TOP, USE IT TO DETECT MOUSEOVER EVENTS #######
      boysLayer.on('mouseover', function (e) {

          // ####### REMOVE THE NONE CLASEE TO DISPLAY & SHOW #######
          info.show();

          // ####### ACCESS PROPERTIES OF THE TARGET LAYER #######
          var props = e.layer.feature.properties;

          // ####### POPULATE HTML ELEMENTS W/ RELEVANT INFO #######
          $('#info span').html(props.COUNTY);
          $(".girls span:first-child").html('(grade ' + currentGrade + ')');
          $(".boys span:first-child").html('(grade ' + currentGrade + ')');
          $(".girls span:last-child").html(Number(props['G' + currentGrade]).toLocaleString());
          $(".boys span:last-child").html(Number(props['B' + currentGrade]).toLocaleString());

          // ####### RAISE OPACITY LEVEL AS VISUAL AFFORDANCE #######
          e.layer.setStyle({
            fillOpacity: .6
          });

          // ####### EMPTY ARRAYS FOR BOYS & GIRLS VALVES #######
          var girlsValues = [],
            boysValues = [];

          // ####### LOOP THROUGH THE GRADE LEVELS & PUSH VALVES INTO THOSE ARRAYS #######
          for (var i = 1; i <= 8; i++) {
            girlsValues.push(props['G' + i]);
            boysValues.push(props['B' + i]);
          }

          // ####### USE JQUERY TO SELECT ELEMENTS USING THE girlspark & #######
          // ####### boyspark CLASS NAMES & INVOKE THE .sparkline() METHOD #######
          $('.girlspark').sparkline(girlsValues, {
              width: '200px',
              height: '30px',
              lineColor: '#D96D02',
              fillColor: '#d98939 ',
              spotRadius: 0,
              lineWidth: 2
          });

          $('.boyspark').sparkline(boysValues, {
              width: '200px',
              height: '30px',
              lineColor: '#6E77B0',
              fillColor: '#878db0',
              spotRadius: 0,
              lineWidth: 2
          });

      });

      // ####### HIDE INFO PANEL WHEN MOUSING OFF LAYERGROUP & REMOVE AFFORDANCE OPACITY #######
      boysLayer.on('mouseout', function(e) {

          // ####### HIDE INFO PANEL #######
          info.hide();

          // ####### RESET LAYER STYLE #######
          e.layer.setStyle({
              fillOpacity: 0
          });
      });

      // ####### WHEN MOUSE MOVES ON THE DOCUMENT #######
      $(document).mousemove(function(e) {
          // ####### OFFSET FROM THE MOUSE POSITION OF THE INFO WINDOW #######
          info.css({
              "left": e.pageX + 6,
              "top": e.pageY - info.height() - 25
          });

          // ####### IF IT CRASHES INTO TOP, FLIP IT TO THE LOWER RIGHT #######
          if (info.offset().top < 4) {
              info.css({
                  "top": e.pageY + 15
              });
          }
          // ####### IF IT CRASHES INTO THE RIGHT, FLIP IT TO THE LEFT #######
          if (info.offset().left + info.width() >= $(document).width() - 40) {
              info.css({
                  "left": e.pageX - info.width() - 80
              });
          }
      });

    } // ####### END retrieveInfo FUNCTION #######

})();
