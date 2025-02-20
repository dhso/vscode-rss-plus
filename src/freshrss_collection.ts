import * as vscode from 'vscode';
import * as cheerio from 'cheerio';
import { join as pathJoin } from 'path';
import { Summary, Abstract } from './content';
import { App } from './app';
import { writeFile, readFile, removeFile, removeDir, fileExists, got } from './utils';
import { Collection } from './collection';

// Documentation for FreshRSS Fever API:
// https://blog.badguy.top/index.php/archives/294/
// https://github.com/DigitalDJ/tinytinyrss-fever-plugin/blob/master/fever-api.md
// https://github.com/romibi/FreshRSS/blob/master/p/api/fever.php
// Some basic calls are:
// https://freshrss.example.net/api/fever.php?api&items
// https://freshrss.example.net/api/fever.php?api&feeds
// https://freshrss.example.net/api/fever.php?api&groups
// https://freshrss.example.net/api/fever.php?api&unread_item_ids
// https://freshrss.example.net/api/fever.php?api&saved_item_ids
// https://freshrss.example.net/api/fever.php?api&items&since_id=some_id
// https://freshrss.example.net/api/fever.php?api&items&max_id=some_id
// https://freshrss.example.net/api/fever.php?api&items&with_ids=some_id
// https://freshrss.example.net/api/fever.php?api&items&feed_ids=some_id
// https://freshrss.example.net/api/fever.php?api&items&group_ids=some_id
// https://freshrss.example.net/api/fever.php?api&mark=item&as=read&id=some_id
// https://freshrss.example.net/api/fever.php?api&mark=item&as=unread&id=some_id
// https://freshrss.example.net/api/fever.php?api&mark=item&as=saved&id=some_id
// https://freshrss.example.net/api/fever.php?api&mark=item&as=unsaved&id=some_id
// https://freshrss.example.net/api/fever.php?api&mark=feed&as=read&before?
// https://freshrss.example.net/api/fever.php?api&mark=group&as=read&before?
// Replace some_id with a real ID from your freshrss_username_entry database.

export interface IFeed {
    id: number;
    favicon_id: number;
    title: string;
    url: string;
    site_url: string;
    is_spark: number;
    last_updated_on_time: number;
}

export interface IFeedGroup {
    group_id: number;
    feed_ids: string;
}

export interface IGroup  {
    id: number;
    title: string;
}

export interface IFeedItem {
    id: string;
    feed_id: number;
    title: string;
    author: string;
    html: string;
    url: string;
    is_saved: number;
    is_read: number;
    created_on_time: number;
}

export class FRESHRSSCollection extends Collection {
    private dirty_abstracts = new Set<string>();
    private feed_tree: FeedTree = [];

    get type() {
        return 'freshrss';
    }

    protected get cfg(): FRESHRSSAccount {
        return super.cfg as FRESHRSSAccount;
    }

    async init() {
        const path = pathJoin(this.dir, 'feed_list');
        if (await fileExists(path)) {
            try {
                const file = await readFile(path);
                if (file.length > 0) {
                    this.feed_tree = JSON.parse(file);
                }
            } catch (error) {
                await removeFile(path);
                throw Error('Failed to read feed list');
            }
        }
        await super.init();
    }

    getFeedList(): FeedTree {
        if (this.feed_tree.length > 0) {
            return this.feed_tree;
        } else {
            return super.getFeedList();
        }
    }

    private async request(type: string, formData?: {[key: string]: any}): Promise<any> {
        const res = await got.post( this.cfg.server + '&' + type, {
            form: {
                'api_key': this.cfg.api_key,
                ...formData
            },
            timeout: App.cfg.timeout * 1000,
            retry: App.cfg.retry
        });
        const response = JSON.parse(res.body);
        if (response.auth !== 1) {
            throw Error(`Auth failed!`);
        }
        return response;
    }

    private async _addFeed(feed: string, category_id: number) {
        // if (this.getSummary(feed) !== undefined) {
        //     vscode.window.showInformationMessage('Feed already exists');
        //     return;
        // }
        // const response = await this.request({
        //     op: 'subscribeToFeed', feed_url: feed, category_id
        // });
        // await this.request({op: 'updateFeed', feed_id: response.content.status.feed_id});
        // await this._fetchAll(false);
        // App.instance.refreshLists();
    }

    private async selectCategory(id: number, tree: FeedTree): Promise<number | undefined> {
        const categories: Category[] = [];
        for (const item of tree) {
            if (typeof(item) !== 'string') {
                categories.push(item);
            }
        }
        if (categories.length > 0) {
            const choice = await vscode.window.showQuickPick([
                '.', ...categories.map(c => c.name)
            ], {placeHolder: 'Select a category'});
            if (choice === undefined) {
                return undefined;
            } else if (choice === '.') {
                return id;
            } else {
                const caty = categories.find(c => c.name === choice)!;
                return this.selectCategory(caty.custom_data, caty.list);
            }
        } else {
            return id;
        }
    }

    async addFeed(feed: string) {
        vscode.window.showInformationMessage('No support for adding feeds yet');
        // const category_id = await this.selectCategory(0, this.feed_tree);
        // if (category_id === undefined) {
        //     return;
        // }
        // await vscode.window.withProgress({
        //     location: vscode.ProgressLocation.Notification,
        //     title: "Updating RSS...",
        //     cancellable: false
        // }, async () => {
        //     try {
        //         await this._addFeed(feed, category_id);
        //     } catch (error: any) {
        //         vscode.window.showErrorMessage('Add feed failed: ' + error.toString());
        //     }
        // });
    }

    async _delFeed(feed: string) {
        vscode.window.showInformationMessage('No support for deleting feeds yet');
        // const summary = this.getSummary(feed);
        // if (summary === undefined) {
        //     return;
        // }
        // await this.request({op: 'unsubscribeFeed', feed_id: summary.custom_data});
        // await this._fetchAll(false);
        // App.instance.refreshLists();
    }

    async delFeed(feed: string) {
        vscode.window.showInformationMessage('No support for deleting feeds yet');
        // await vscode.window.withProgress({
        //     location: vscode.ProgressLocation.Notification,
        //     title: "Updating RSS...",
        //     cancellable: false
        // }, async () => {
        //     try {
        //         await this._delFeed(feed);
        //     } catch (error: any) {
        //         vscode.window.showErrorMessage('Remove feed failed: ' + error.toString());
        //     }
        // });
    }

    async addToFavorites(id: string) {
        const abstract = this.getAbstract(id);
        if (!abstract) {
            return;
        }
        abstract.starred = true;
        this.updateAbstract(id, abstract);
        await this.commit();

        this.request(`mark=item&as=saved&id=${abstract.custom_data}`).catch(error => {
            vscode.window.showErrorMessage('Add favorite failed: ' + error.toString());
        });
    }

    async removeFromFavorites(id: string) {
        const abstract = this.getAbstract(id);
        if (!abstract) {
            return;
        }
        abstract.starred = false;
        this.updateAbstract(id, abstract);
        await this.commit();

        this.request(`mark=item&as=unsaved&id=${abstract.custom_data}`).catch(error => {
            vscode.window.showErrorMessage('Remove favorite failed: ' + error.toString());
        });
    }

    private async fetch(url: string, update: boolean) {
        const summary = this.getSummary(url);
        if (summary === undefined || summary.custom_data === undefined) {
            throw Error('Feed dose not exist');
        }
        if (!update && summary.ok) {
            return;
        }

        const response = await this.request(`items&feed_ids=${summary.custom_data}`);
        const items = response.items as IFeedItem[];
        const abstracts: Abstract[] = [];
        const ids = new Set<string>();
        for (const item of items) {
            const abstract = new Abstract(
                item.id.toString(),
                item.title,
                item.created_on_time * 1000,
                item.url,
                item.is_read === 1,
                url,
                item.is_saved === 1,
                item.id
            );
            abstracts.push(abstract);
            ids.add(abstract.id);
            this.updateAbstract(abstract.id, abstract);
            this.updateContent(abstract.id, item.html);
        }

        for (const id of summary.catelog) {
            if (!ids.has(id)) {
                const abstract = this.getAbstract(id);
                if (abstract) {
                    if (!abstract.read) {
                        abstract.read = true;
                        this.updateAbstract(abstract.id, abstract);
                    }
                    abstracts.push(abstract);
                }
            }
        }

        abstracts.sort((a, b) => b.date - a.date);
        summary.catelog = abstracts.map(a => a.id);
        this.updateSummary(url, summary);
    }

    private async _fetchAll(update: boolean) {
        const [groupsRes, feedsRes] = await Promise.all([this.request('groups'), this.request('feeds')]);
        const _groups: IGroup[] = groupsRes.groups;
        const _feeds_groups: IFeedGroup[] = groupsRes.feeds_groups;
        const _feeds: IFeed[] = feedsRes.feeds;
        const feed_map = new Map(_feeds.map(
            (feed: any): [number, string] => [feed.id, feed.url]
        ));
        const list: FeedTree = [];
        for (const fg of _feeds_groups) {
            const group = _groups.find(g => g.id === fg.group_id);
            if (group === undefined) {
                continue;
            }
            const sub: FeedTree = [];
            for (const fid of fg.feed_ids.split(',')) {
                const subFeed = _feeds.find(f => f.id === Number(fid));
                if (subFeed === undefined) {
                    continue;
                }
                sub.push(subFeed.url);
                let summary = this.getSummary(subFeed.url);
                if (summary) {
                    summary.ok = true;
                    summary.title = subFeed.title;
                    summary.custom_data = subFeed.id;
                } else {
                    summary = new Summary(subFeed.url, subFeed.title, [], true, subFeed.id);
                }
                this.updateSummary(subFeed.url, summary);
            }
            list.push({
                name: group.title,
                list: sub,
                custom_data: groupsRes.last_refreshed_on_time
            });
        }
        this.feed_tree = list;

        const feeds = new Set(feed_map.values());
        for (const feed of this.getFeeds()) {
            if (!feeds.has(feed)) {
                this.updateSummary(feed, undefined);
            }
        }
        await Promise.all(this.getFeeds().map(url => this.fetch(url, update)));
        await this.commit();
    }

    async fetchOne(url: string, update: boolean) {
        try {
            if (update) {
                const summary = this.getSummary(url);
                if (summary === undefined || summary.custom_data === undefined) {
                    throw Error('Feed dose not exist');
                }
                // 触发服务端更新
                // await this.request(`items&feed_ids=${summary.custom_data}`);
            }
            await this.fetch(url, update);
            await this.commit();
        } catch (error: any) {
            vscode.window.showErrorMessage('Update feed failed: ' + error.toString());
        }
    }

    async fetchAll(update: boolean) {
        try {
            await this._fetchAll(update);
        } catch (error: any) {
            vscode.window.showErrorMessage('Update feeds failed: ' + error.toString());
        }
    }

    updateAbstract(id: string, abstract?: Abstract) {
        this.dirty_abstracts.add(id);
        return super.updateAbstract(id, abstract);
    }

    private async syncReadStatus(list: number[], read: boolean) {
        if (list.length <= 0) {
            return;
        }
        for (const id of list) {
            await this.request(`mark=item&as=${read?'read':'unread'}&id=${id}`);
        }
    }

    async commit() {
        const read_list: number[] = [];
        const unread_list: number[] = [];
        for (const id of this.dirty_abstracts) {
            const abstract = this.getAbstract(id);
            if (abstract) {
                if (abstract.read) {
                    read_list.push(abstract.custom_data);
                } else {
                    unread_list.push(abstract.custom_data);
                }
            }
        }
        this.dirty_abstracts.clear();
        Promise.all([
            this.syncReadStatus(read_list, true),
            this.syncReadStatus(unread_list, false),
        ]).catch(error => {
            vscode.window.showErrorMessage('Sync read status failed: ' + error.toString());
        });

        await writeFile(pathJoin(this.dir, 'feed_list'), JSON.stringify(this.feed_tree));
        await super.commit();
    }

}
