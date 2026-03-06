// All RSS feed sources organized by tab
// Uses /api/proxy.js to bypass CORS — do not change fetch pattern

export const TABS = [
  {
    id: 'geopolitics',
    label: 'World',
    icon: '🌍',
    feeds: [
      {
        name: 'NPR World',
        url: 'https://feeds.npr.org/1004/rss.xml',
      },
      {
        name: 'NYT World',
        url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
      },
      {
        name: 'Washington Post World',
        url: 'https://feeds.washingtonpost.com/rss/world',
      },
      {
        name: 'CNN World',
        url: 'http://rss.cnn.com/rss/edition_world.rss',
      },
      {
        name: 'AP Top News',
        url: 'https://rsshub.app/apnews/topics/apf-topnews',
      },
    ],
  },
  {
    id: 'politics',
    label: 'Politics',
    icon: '🏛️',
    feeds: [
      {
        name: 'NPR Politics',
        url: 'https://feeds.npr.org/1014/rss.xml',
      },
      {
        name: 'NYT Politics',
        url: 'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml',
      },
      {
        name: 'Washington Post Politics',
        url: 'https://feeds.washingtonpost.com/rss/politics',
      },
      {
        name: 'CNN Politics',
        url: 'http://rss.cnn.com/rss/cnn_allpolitics.rss',
      },
      {
        name: 'MSN News',
        url: 'https://assets.msn.com/content/news/rss?market=en-us&ocid=rss',
      },
    ],
  },
  {
    id: 'longisland',
    label: 'Long Island',
    icon: '🗽',
    feeds: [
      {
        name: 'Newsday Breaking News',
        url: 'https://www.newsday.com/news/rss',
      },
      {
        name: 'Newsday Long Island',
        url: 'https://www.newsday.com/long-island/rss',
      },
      {
        name: 'Patch Long Island',
        url: 'https://patch.com/new-york/long-island/rss.xml',
      },
      {
        name: 'News 12 Long Island',
        url: 'https://longisland.news12.com/rss',
      },
      {
        name: 'LIBN (LI Business News)',
        url: 'https://libn.com/feed/',
      },
    ],
  },
  {
    id: 'south',
    label: 'South',
    icon: '🌿',
    feeds: [
      {
        name: 'AL.com Alabama',
        url: 'https://www.al.com/arc/outboundfeeds/rss/?outputType=xml',
      },
      {
        name: 'Mississippi Clarion Ledger',
        url: 'https://www.clarionledger.com/arcio/rss/',
      },
      {
        name: 'WLOX Mississippi',
        url: 'https://www.wlox.com/rss/news.xml',
      },
      {
        name: 'Gulf Live (MS/AL Gulf Coast)',
        url: 'https://www.gulflive.com/arc/outboundfeeds/rss/?outputType=xml',
      },
      {
        name: 'WCBI North Mississippi',
        url: 'https://www.wcbi.com/feed',
      },
      {
        name: 'WHNT Alabama News',
        url: 'https://whnt.com/feed/',
      },
    ],
  },
  {
    id: 'realestate',
    label: 'Real Estate',
    icon: '🏡',
    feeds: [
      {
        name: 'NYT Real Estate',
        url: 'https://rss.nytimes.com/services/xml/rss/nyt/RealEstate.xml',
      },
      {
        name: 'Washington Post Real Estate',
        url: 'https://feeds.washingtonpost.com/rss/business/real-estate',
      },
      {
        name: 'Newsday Real Estate',
        url: 'https://www.newsday.com/business/real-estate/rss',
      },
      {
        name: 'Realtor.com News',
        url: 'https://www.realtor.com/news/feed/',
      },
      {
        name: 'Inman Real Estate',
        url: 'https://www.inman.com/feed/',
      },
    ],
  },
  {
    id: 'magazines',
    label: 'Magazines',
    icon: '📰',
    feeds: [
      {
        name: 'TIME',
        url: 'https://time.com/feed/',
      },
      {
        name: 'The New Yorker',
        url: 'https://www.newyorker.com/feed/everything',
      },
      {
        name: 'The New Yorker · News & Politics',
        url: 'https://www.newyorker.com/feed/news',
      },
      {
        name: 'People',
        url: 'https://people.com/feed/',
      },
    ],
  },
  {
    id: 'sports',
    label: 'Sports',
    icon: '🏆',
    feeds: [
      {
        name: 'ESPN Top Headlines',
        url: 'https://www.espn.com/espn/rss/news',
      },
      {
        name: 'ESPN NFL',
        url: 'https://www.espn.com/espn/rss/nfl/news',
      },
      {
        name: 'ESPN MLB',
        url: 'https://www.espn.com/espn/rss/mlb/news',
      },
      {
        name: 'Newsday Sports',
        url: 'https://www.newsday.com/sports/rss',
      },
    ],
  },
];
