let video;
let sortingDone = false;
let THRESHOLD = 30; //brightness threshold

function setup() {
  createCanvas(windowWidth, windowHeight);

  //video setup
  video = createCapture(VIDEO);
  video.hide(); //hide the html video element
}

function draw() {
  background(220);

  if (!sortingDone) {
    video.loadPixels();

    for (let x = 0; x < video.width; x++) {
      sortColumn(x);
    }

    for (let y = 0; y < video.height; y++) {
      sortRow(y);
    }

    
    video.updatePixels();
    image(video, 0, 0, video.width, video.height);
    // sortingDone = true;
  }

  // noLoop();

}

function sortColumn(x) {
  let y = 0;
  while (y < video.height) {
    while (y < video.height) {
      let index = (x + y * video.width) * 4;
      let r = video.pixels[index];
      let g = video.pixels[index + 1];
      let b = video.pixels[index + 2];
      let bn = brightness(color(r, g, b));

      if (bn > THRESHOLD) {
        break;
      }
      y++;
    }
    let startY = y;

    while (y < video.height) {
      let index = (x + y * video.width) * 4;
      let r = video.pixels[index];
      let g = video.pixels[index + 1];
      let b = video.pixels[index + 2];
      let bn = brightness(color(r, g, b));

      if (bn <= THRESHOLD) {
        break;
      }
      y++;
    }
    let endY = y - 1;

    if (startY < endY) {
      //sort the segment from startY to endY
      let segment = [];
      for (let j = startY; j <= endY; j++) {
        let index = (x + j * video.width) * 4;
        let r = video.pixels[index],
            g = video.pixels[index + 1],
            b = video.pixels[index + 2];
        segment.push(color(r, g, b));
      }

      segment.sort((a, b) => brightness(a) - brightness(b));

      for (let j = startY; j <= endY; j++) {
        let index = (x + j * video.width) * 4;
        let c = segment[j - startY];
        video.pixels[index] = red(c);
        video.pixels[index + 1] = green(c);
        video.pixels[index + 2] = blue(c);
        video.pixels[index + 3] = 255;
      }
      y++
    }
  }
}

function sortRow(y) {
  let x = 0;
  while (x < video.width) {
    while (x < video.width) {
      let index = (x + y * video.width) * 4;
      let r = video.pixels[index];
      let g = video.pixels[index + 1];
      let b = video.pixels[index + 2];
      let bn = brightness(color(r, g, b));

      if (bn > THRESHOLD) {
        break;
      }
      x++;
    }
    let startX = x;

    while (x < video.width) {
      let index = (x + y * video.width) * 4;
      let r = video.pixels[index];
      let g = video.pixels[index + 1];
      let b = video.pixels[index + 2];
      let bn = brightness(color(r, g, b));

      if (bn <= THRESHOLD) {
        break;
      }
      x++;
    }
    let endX = x - 1;

    if (startX < endX) {
      //sort the segment from startX to endX
      let segment = [];
      for (let j = startX; j <= endX; j++) {
        let index = (j + y * video.width) * 4;
        let r = video.pixels[index],
            g = video.pixels[index + 1],
            b = video.pixels[index + 2];
        segment.push(color(r, g, b));
      }

      segment.sort((a, b) => brightness(a) - brightness(b));

      for (let j = startX; j <= endX; j++) {
        let index = (j + y * video.width) * 4;
        let c = segment[j - startX];
        video.pixels[index] = red(c);
        video.pixels[index + 1] = green(c);
        video.pixels[index + 2] = blue(c);
        video.pixels[index + 3] = 255;
      }
      x++
    }
  }
}
