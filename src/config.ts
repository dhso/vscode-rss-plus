interface Account {
    name: string;
    type: 'local' | 'ttrss' | 'freshrss';
}

type FeedTree = (string | Category)[];

interface Category {
    name: string;
    list: FeedTree;
    custom_data?: any;
}

interface LocalAccount extends Account {
    feeds: FeedTree;
}

interface TTRSSAccount extends Account {
    server: string;
    username: string;
    password: string;
}

interface InoreaderAccount extends Account {
    appid: string;
    appkey: string;
}

interface FRESHRSSAccount extends Account {
    server: string;
    username: string;
    password: string;
    api_key: string;
}