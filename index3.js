var videoElement;
var labels;
var data;

  async function start() {
     
    // Load the model.
    const tfliteModel = await tf.loadGraphModel(
      "jsmodelv4/model.json",
    );
    // Create an XMLHttpRequest object
    const xhr = new XMLHttpRequest();

    // Define the URL of the file you want to request
    fileUrl = 'label.txt'; // Replace with the actual URL of your file

    xhr.onload = function() {
    if (xhr.status === 200) {
        // The request was successful
        const fileContent = xhr.responseText; // Get the file content as a string
        labels = fileContent.split('\n'); // Split the content into lines
    }
    else {
      console.error("Request failed with status", xhr.status);
    }
    }
    xhr.open('GET', fileUrl, true);
    xhr.send();

    const dataxhr = new XMLHttpRequest(); 
    dataxhr.open("GET", "foodkeeper.json", true);
    dataxhr.onload = function() {
      if (this.status == 200) {
        // The request was successful, parse the JSON data
        data = JSON.parse(this.responseText);
      } else {
        // The request failed
        alert("Error loading foodkeeper.json");
      }
    };
    dataxhr.send();

    // Setup the trigger button.
    setupTrigger(tfliteModel);
  }
  
  async function callTfliteModel(tfliteModel) {
    // Prepare the input tensors from the image.
    // const inputTensor = tf.image
    //   .resizeBilinear(tf.browser.fromPixels(document.getElementById("food-image")), [
    //     224,
    //     224
    //   ])
    //   // Normalize.
    //   .expandDims();
    //   //  .div(127.5)
    //   //  .sub(1);
    
    // Run the inference and get the output tensors.
    const tfwebcam = await tf.data.webcam(videoElement, {
      resizeWidth: 224,
      resizeHeight: 224,
      facingMode: 'environment'
    });
    let predictimg = await tfwebcam.capture();
    predictimg = predictimg.expandDims(0).div(127.5).sub(1);

    const predict2 = tfliteModel.predict(predictimg);
    // let predictions = outputTensor.dataSync();
    // console.log(predictions);
    // function findIndexOfLargest(arr) {
    //   if (arr.length === 0) {
    //       return -1; // Return -1 for an empty array
    //   }
  
    //   let largestIndex = 0; // Initialize the index of the largest element to the first element
  
    //   for (let i = 1; i < arr.length; i++) {
    //       if (arr[i] > arr[largestIndex]) {
    //           largestIndex = i; // Update the index if a larger element is found
    //       }
    //   }
  
    //   return largestIndex;
    // }
    
    // // Example usage:
    // const indexOfLargest = findIndexOfLargest(predictions);
    // console.log(labels[indexOfLargest], predictions[indexOfLargest]);
    //relevant_data = data['sheets'][2]['data'][286];
    // console.log(relevant_data);
    const predictionArray = predict2.arraySync()[0]; // Convert predictions to a JavaScript array
    const topPredictionIndex = predictionArray.indexOf(Math.max(...predictionArray)); // Find the index of the class with the highest probability
    console.log(labels[topPredictionIndex], predictionArray[topPredictionIndex]);
    const results = search_for_food(labels[topPredictionIndex], true);

    const foodname = document.getElementById("food-name");
    foodname.innerHTML = labels[topPredictionIndex];
    const infobox = document.getElementById("info");
    infobox.innerHTML = "";

    const headings = {
      "pantry": "The shelf life is ", 
      "refrigerate": "Can be refrigerated for ", 
      "freeze":"Can be stored frozen for "
    };
    for (const typename of ["pantry", "refrigerate", "freeze"]) {
      if (results[typename][1] !== "1") {
        const elem = document.createElement("p");
        elem.className = typename + " " + "card-text";
        elem.innerHTML = headings[typename] + results[typename][0] + " " + results[typename][1];
        infobox.appendChild(elem);
      }
    }
    for (const typename of ["pantry_tips", "refrigerate_tips", "freeze_tips"]) {
      if (results[typename]) {
        const elem = document.createElement("p");
        elem.className = typename +  " " + "card-text";
        elem.innerHTML = "Tip: ";
        elem.innerHTML += results[typename];
        infobox.appendChild(elem);
      }
    }

    //        const tipname = typename + "_tips";
    //if (results[tipname])elem.innerHTML += "<br>"+   results[tipname];

    // Process and draw the result on the canvas.
    //
    // // De-normalize.
    // const data = outputTensor.add(1).mul(127.5);
    // // Convert from RGB to RGBA, and create and return ImageData.
    // const rgb = Array.from(data.dataSync());
    // const rgba = [];
    // for (let i = 0; i < rgb.length / 3; i++) {
    //   for (let c = 0; c < 3; c++) {
    //     rgba.push(rgb[i * 3 + c]);
    //   }
    //   rgba.push(255);
    // }
    // // Draw on canvas.
    // const imageData = new ImageData(Uint8ClampedArray.from(rgba), 224, 224);
    // const canvas = document.querySelector("canvas");
    // const ctx = canvas.getContext("2d");
    // ctx.putImageData(imageData, 0, 0);
    // canvas.classList.remove("hide");
  }
  
  function setupTrigger(tfliteModel) {
    console.log("setupTrigger()");
    const floatingbutton = document.getElementById("floating-button");
    

    document.getElementById("floating-button").addEventListener("click", (e) => {
      // floatingbutton.textContent = "Processing...";
      console.log("Clicked");
      setTimeout(() => {
        const imgelement = document.getElementById("food-image");
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        
        // // Draw the current video frame onto the canvas
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        // // Convert the canvas content to a data URL (JPG image)
        const dataUrl = canvas.toDataURL('image/jpeg');
        imgelement.src = dataUrl;                    
        callTfliteModel(tfliteModel);
      });
    })
  }
  
document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("open-button").addEventListener("click", async function() {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            await navigator.mediaDevices.getUserMedia({ video: {facingMode: "environment"}})
            .then(function (stream) {
                videoElement = document.getElementById('camera-feed'); // Assign the videoElement here
                videoElement.srcObject = stream;
                videoElement.play();
                document.getElementById("floating-button").style.display = 'block';
            })
            .catch(function (error) {
                console.error('Error accessing the camera:', error);
            })
        }
    });
    document.getElementById("stop-button").addEventListener("click", async function() {
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject;
        const tracks = stream.getTracks();

        tracks.forEach(function (track) {
            track.stop(); // Stop each track in the stream
        });

        videoElement.srcObject = null; // Remove the video stream from the video element
        document.getElementById("floating-button").style.display = 'none';
      }
    });
    start();
});

function search_for_food(name, usemapping=true) {
  const mapping = { "Apple": "Apples", "Banana":"Bananas", "Bean":"Beans and peas", "Bitter_Gourd":"Melons", "Bottle_Gourd":"Melons", "Brinjal": "Apple", "Broccoli": "Broccoli and broccoli raab (rapini)", "Cabbage":"Cabbage", "Capsicum":"Pepper", "Carrot":"Carrots Parsnips", "Cauliflower":"Cauliflower", "Cucumber":"Cucumbers", "Guava":"Guava", "Lime":"Citrus Fruit", "Orange": "Citrus Fruit", "Papaya":"Papaya Mango Feijoa Passionfruit Casaha Melon", "Pomegranate":"Pomegranate", "Potato":"Potatoes", "Pumpkin":"Pumpkins", "Radish":"Radishes", "Tomato":"Tomatoes"}
  const items = data['sheets'][2]['data'];
  name = name.replace(/\s+$/, '');

  let results = new Object({
    "pantry": [0, "1"],
    "refrigerate": [0, "1"],
    "freeze": [0, "1"],
  });

  if (usemapping) {
    for (let [index, item] of items.entries()) {
      if (item[2]['Name'] === mapping[name]) {
        const focus = item;
        console.log(focus);
        for (const obj of focus) {
          const key = Object.keys(obj)[0]; // Get the key
          const value = obj[key]; // Get the value
      
            if (key.includes("Pantry_Max")) {
              if (value) results["pantry"][0] = (value);
            }
            if (key.includes("Refrigerate_Max")) {
              if (value) results["refrigerate"][0] = (value);
            }
            if (key.includes("Freeze_Max")) {
              if (value) results["freeze"][0] = (value);
            }
            if (key.includes("Pantry_Metric")) {
              if (value) results["pantry"][1] = (value);
            }
            if (key.includes("Refrigerate_Metric")) {
              if (value) results["refrigerate"][1] = (value);
            }
            if (key.includes("Freeze_Metric")) {
              if (value) results["freeze"][1] = (value);
            }

            // tips
            if (key.includes("Pantry_tips")) {
              if (value) results["pantry_tips"] = value;
            }
            if (key.includes("Refrigerate_tips")) {
              if (value) results["refrigerate_tips"] = value;
            }
            if (key.includes("Freeze_tips")) {
              if (value) results["freeze_tips"] = value;
            }
        }
      }
    }
  }
  else {
    console.warn("Unsupported operation: usemapping == false");
  }
  console.log(results);
  return results;
}

function redirectConsoleToHTML(message) {
  const consoleOutputElement = document.getElementById("console-output");
  consoleOutputElement.innerHTML += `<p class="console-output">${message}</p>`;
}

// Redirect all console messages to the function
console.log = redirectConsoleToHTML;
console.warn = redirectConsoleToHTML;
console.error = redirectConsoleToHTML;
console.debug = redirectConsoleToHTML;