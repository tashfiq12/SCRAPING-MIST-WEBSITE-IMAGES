const puppeteer = require('puppeteer');
const URL = 'https://mist.ac.bd'; // you just need to change this  website address only
const fs = require('fs');
const request = require('request');
const writeStream = fs.createWriteStream('Collected_Data.csv');
writeStream.write(`ImageCaption, ImageUrl \n`);
writeStream.write(`\n\n`);

var download = function(uri, filename, callback) {
  request.head(uri, function(err, res, body) {
    request(uri)
      .pipe(fs.createWriteStream(filename))
      .on('close', callback);
  });
};

puppeteer
  .launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  .then(async browser => {
    const page = await browser.newPage();
    await page.setViewport({ width: 320, height: 600 });
    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 9_0_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13A404 Safari/601.1'
    );

    await page.goto(URL);
    await page.waitForSelector('div#myCarousel');

    await page.addScriptTag({
      url: 'https://code.jquery.com/jquery-3.2.1.min.js'
    });

    const result = await page.evaluate(() => {
      try {
        var data = [];
        let pictureMap = new Map();
        $('div#myCarousel .carousel-inner .item').each(function() {
          const title = $(this)
            .find('.carousel-caption .panel .panel-body h4 a')
            .attr('title');
          const imageUrl = $(this)
            .find('.fill')
            .attr('data-src');
          if (pictureMap.get(imageUrl) !== 1) {
            data.push({
              title: title,
              picturelink: imageUrl
            });
            pictureMap.set(imageUrl, 1);
          }
        });
        return data; // Return our data array
      } catch (err) {
        reject(err.toString());
      }
    });

    // let's close the browser
    await browser.close();

    // ok, let's log details...

    for (var i = 0; i < result.length; i++) {
      writeStream.write(`${result[i].title},  ${result[i].picturelink} \n`);
      var value = i + 1;
      download(result[i].picturelink, 'picture' + value + '.jpg', function() {
        console.log('Image saved');
      });
    }
  })
  .catch(function(error) {
    console.error('Error caught!');
    process.exit();
  });
