const axios = require('axios');
const cheerio = require('cheerio');

module.exports = (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }

  // Membuat URL dinamis berdasarkan query
  const url = `https://otakudesu.cloud/episode/${q}/`;

  axios.get(url)
    .then((response) => {
      const $ = cheerio.load(response.data);

      // Menangkap data anime
      const animeData = {
        anime: {
          title: $('.posttl').text().trim(),
          posted_by: $('.kategoz span').first().text().replace('Posted by ', '').trim(),
          release_time: $('.kategoz span').last().text().replace('Release on ', '').trim(),
          episode_links: [],
          video_stream: [],
          download_links: [],
          iframe_url: '', // Menyimpan URL iframe
        }
      };

      // Mengambil URL dari iframe dengan src tertentu
      const iframeUrl = $('iframe').attr('src');
      if (iframeUrl) {
        animeData.anime.iframe_url = iframeUrl;
      }

      // Mengambil episode links
      $('#selectcog option').each((index, element) => {
        const episodeTitle = $(element).text();
        const episodeUrl = $(element).attr('value');
        if (episodeUrl) {
          animeData.anime.episode_links.push({ episode: episodeTitle, url: episodeUrl });
        }
      });

      // Mengambil link video stream
      $('.mirrorstream ul').each((index, element) => {
        const quality = $(element).find('span').first().text();
        const mirrors = [];
        $(element).find('li').each((_, li) => {
          const mirrorName = $(li).text();
          const mirrorUrl = $(li).find('a').attr('data-content');
          mirrors.push({ name: mirrorName, url: mirrorUrl });
        });
        animeData.anime.video_stream.push({ quality, mirrors });
      });

      // Mengambil download links
      $('.download li').each((index, element) => {
        const quality = $(element).find('strong').text();
        const size = $(element).find('i').text();
        const links = [];
        $(element).find('a').each((_, link) => {
          const linkName = $(link).text();
          const linkUrl = $(link).attr('href');
          links.push({ name: linkName, url: linkUrl });
        });
        animeData.anime.download_links.push({ quality, size, links });
      });

      // Mengirimkan data dalam format JSON
      res.status(200).json(animeData);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch data' });
    });
};
