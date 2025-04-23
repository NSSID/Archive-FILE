const express = require('express');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const router = express.Router();

router.get('/', async (req, res) => {
  const slug = req.query.slug;
  const url = `https://otakudesu.cloud/anime/${slug}/`;

  try {
    // Launch browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Set user agent to avoid blocks
    await page.setUserAgent(
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
    );

    // Navigate to the page and wait until it's fully loaded
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Get page content
    const html = await page.content();
    const $ = cheerio.load(html);

    // Extract data
    const title = $('.venser h1').text().trim();
    const thumbnail = $('.fotoanime img').attr('src');
    const infoItems = $('.infozin > p');
    const synopsis = $('.sinopc').text().trim();

    let japanese = "", score = "", producers = "", type = "", status = "",
        totalEpisodes = "", duration = "", releaseDate = "", studio = "", genres = [];

    // Parse info items
    infoItems.each((i, el) => {
      const text = $(el).text().trim();

      if (text.includes('Japanese')) japanese = text.replace('Japanese: ', '');
      if (text.includes('Skor')) score = text.replace('Skor: ', '');
      if (text.includes('Produser')) producers = text.replace('Produser: ', '');
      if (text.includes('Tipe')) type = text.replace('Tipe: ', '');
      if (text.includes('Status')) status = text.replace('Status: ', '');
      if (text.includes('Total Episode')) totalEpisodes = text.replace('Total Episode: ', '');
      if (text.includes('Durasi')) duration = text.replace('Durasi: ', '');
      if (text.includes('Tanggal Rilis')) releaseDate = text.replace('Tanggal Rilis: ', '');
      if (text.includes('Studio')) studio = text.replace('Studio: ', '');
      if (text.includes('Genre')) genres = text.replace('Genre: ', '').split(',').map(g => g.trim());
    });

    // Extract batch link details
    const batchLinkEl = $('.batchlink a');
    const batchTitle = batchLinkEl.text().trim();
    const batchLink = batchLinkEl.attr('href') || '';
    const batchDate = $('.batchlink span').last().text().trim();

    // Extract episodes details
    const episodes = [];
    $('.episodelist ul li').each((i, el) => {
      const episodeTitle = $(el).find('a').text().trim();
      const episodeUrl = $(el).find('a').attr('href');
      const episodeDate = $(el).find('.zeebr').text().trim();
      episodes.push({ title: episodeTitle, url: episodeUrl, upload_date: episodeDate });
    });

    // Close browser
    await browser.close();

    // Send response in JSON format
    res.json({
      status: 200,
      success: true,
      data: {
        title,
        japanese,
        score,
        producers,
        type,
        status,
        total_episodes: totalEpisodes,
        duration,
        release_date: releaseDate,
        studio,
        genres,
        synopsis,
        thumbnail,
        batch_download: {
          title: batchTitle,
          url: batchLink,
          upload_date: batchDate
        },
        episodes
      }
    });
  } catch (err) {
    // Handle errors and send response
    res.status(500).json({
      status: 500,
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;
