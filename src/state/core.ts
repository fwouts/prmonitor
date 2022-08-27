import { computed, makeObservable, observable } from "mobx";
import { BadgeState } from "../badge/api";
import { Context } from "../environment/api";
import { EnrichedPullRequest } from "../filtering/enriched-pull-request";
import {
  Filter,
  FilteredPullRequests,
  filterPullRequests
} from "../filtering/filters";
import { PullRequestReference, RepoReference } from "../github-api/api";
import { LoadedState, PullRequest } from "../storage/loaded-state";
import {
  addMute,
  MuteConfiguration,
  MuteType,
  NOTHING_MUTED,
  removeOwnerMute,
  removePullRequestMute,
  removeRepositoryMute
} from "../storage/mute-configuration";

export class Core {
  private readonly context: Context;

  @observable overallStatus: "loading" | "loaded" = "loading";
  @observable refreshing = false;
  @observable token: string | null = null;
  @observable loadedState: LoadedState | null = null;
  @observable muteConfiguration = NOTHING_MUTED;
  @observable notifiedPullRequestUrls = new Set<string>();
  @observable lastError: string | null = null;

  constructor(context: Context) {
    makeObservable(this);
    this.context = context;
    this.context.messenger.listen((message) => {
      console.debug("Message received", message);
      if (message.kind === "reload") {
        this.load();
      }
    });
    this.context.notifier.registerClickListener((url) =>
      this.openPullRequest(url).catch(console.error)
    );
  }

  async load() {
    this.token = await this.context.store.token.load();
    if (this.token !== null) {
      this.refreshing = await this.context.store.currentlyRefreshing.load();
      this.lastError = await this.context.store.lastError.load();
      this.notifiedPullRequestUrls = new Set(
        await this.context.store.notifiedPullRequests.load()
      );
      this.muteConfiguration =
        await this.context.store.muteConfiguration.load();
      this.loadedState = await this.context.store.lastCheck.load();
    } else {
      this.refreshing = false;
      this.lastError = null;
      this.token = null;
      this.loadedState = null;
      this.notifiedPullRequestUrls = new Set();
      this.muteConfiguration = NOTHING_MUTED;
    }
    this.overallStatus = "loaded";
    this.updateBadge();
  }

  async setNewToken(token: string) {
    this.token = token;
    await this.context.store.token.save(token);
    await this.saveRefreshing(false);
    await this.saveError(null);
    await this.saveNotifiedPullRequests([]);
    await this.saveLoadedState(null);
    await this.saveMuteConfiguration(NOTHING_MUTED);
    await this.load();
    this.triggerBackgroundRefresh();
  }

  async refreshPullRequests() {
    if (!this.token) {
      console.debug("Not authenticated, skipping refresh.");
      return;
    }
    if (!this.context.isOnline()) {
      console.debug("Not online, skipping refresh.");
      return;
    }
    await this.saveRefreshing(true);
    await this.triggerReload();
    this.updateBadge();
    try {
      const startRefreshTimestamp = this.context.getCurrentTime();
      await this.saveLoadedState({
        startRefreshTimestamp,
        ...(await this.context.githubLoader(this.token, this.loadedState)),
      });
      const notifyAboutPullRequests = [
        ...(this.unreviewedPullRequests || []),
        ...(this.actionRequiredOwnPullRequests || []),
      ];
      await this.context.notifier.notify(
        notifyAboutPullRequests,
        this.notifiedPullRequestUrls
      );
      await this.saveNotifiedPullRequests(notifyAboutPullRequests);
      this.saveError(null);
    } catch (e: any) {
      this.saveError(e.message);
      throw e;
    } finally {
      await this.saveRefreshing(false);
      this.updateBadge();
      this.triggerReload();
    }
  }

  async openPullRequest(pullRequestUrl: string) {
    await this.context.tabOpener.openPullRequest(pullRequestUrl);
  }

  async mutePullRequest(pullRequest: PullRequestReference, muteType: MuteType) {
    await this.saveMuteConfiguration(
      addMute(this.context, this.muteConfiguration, pullRequest, muteType)
    );
    this.updateBadge();
  }

  async unmutePullRequest(pullRequest: PullRequestReference) {
    await this.saveMuteConfiguration(
      removePullRequestMute(this.muteConfiguration, pullRequest)
    );
    this.updateBadge();
  }

  async unmuteOwner(owner: string) {
    await this.saveMuteConfiguration(
      removeOwnerMute(this.muteConfiguration, owner)
    );
    this.updateBadge();
  }

  async unmuteRepository(repo: RepoReference) {
    await this.saveMuteConfiguration(
      removeRepositoryMute(this.muteConfiguration, repo)
    );
    this.updateBadge();
  }

  async toggleNewCommitsNotificationSetting() {
    await this.saveMuteConfiguration({
      ...this.muteConfiguration,
      notifyNewCommits: !this.muteConfiguration.notifyNewCommits,
    });
    this.updateBadge();
  }

  async toggleOnlyDirectRequestsSetting() {
    const newOnlyDirectRequests = !this.muteConfiguration.onlyDirectRequests;
    await this.saveMuteConfiguration({
      ...this.muteConfiguration,
      onlyDirectRequests: newOnlyDirectRequests,
    });
    this.updateBadge();
  }

  async onChangeWhitelistedTeamsSetting(teams: string[]) {
    await this.saveMuteConfiguration({
      ...this.muteConfiguration,
      whitelistedTeams: teams,
    });
    this.updateBadge();
  }

  @computed
  get filteredPullRequests(): FilteredPullRequests | null {
    const lastCheck = this.loadedState;
    if (!lastCheck || !lastCheck.userLogin) {
      return null;
    }
    return filterPullRequests(
      this.context,
      lastCheck.userLogin,
      lastCheck.openPullRequests,
      this.muteConfiguration
    );
  }

  @computed
  get unreviewedPullRequests(): EnrichedPullRequest[] | null {
    return this.filteredPullRequests
      ? this.filteredPullRequests[Filter.INCOMING]
      : null;
  }

  @computed
  get actionRequiredOwnPullRequests(): EnrichedPullRequest[] | null {
    return this.filteredPullRequests
      ? this.filteredPullRequests[Filter.MINE].filter(
          (pr) =>
            pr.state.kind === "outgoing" &&
            (pr.state.approvedByEveryone || pr.state.changesRequested)
        )
      : null;
  }

  private async saveNotifiedPullRequests(pullRequests: PullRequest[]) {
    this.notifiedPullRequestUrls = new Set(pullRequests.map((p) => p.htmlUrl));
    await this.context.store.notifiedPullRequests.save(
      Array.from(this.notifiedPullRequestUrls)
    );
  }

  private async saveError(error: string | null) {
    this.lastError = error;
    await this.context.store.lastError.save(error);
  }

  private async saveRefreshing(refreshing: boolean) {
    this.refreshing = refreshing;
    await this.context.store.currentlyRefreshing.save(refreshing);
  }

  private async saveLoadedState(lastCheck: LoadedState | null) {
    this.loadedState = lastCheck;
    await this.context.store.lastCheck.save(lastCheck);
  }

  private async saveMuteConfiguration(muteConfiguration: MuteConfiguration) {
    this.muteConfiguration = muteConfiguration;
    await this.context.store.muteConfiguration.save(muteConfiguration);
  }

  private updateBadge() {
    let badgeState: BadgeState;
    const unreviewedPullRequests = this.unreviewedPullRequests;
    if (this.lastError || !this.token) {
      badgeState = {
        kind: "error",
      };
    } else if (!unreviewedPullRequests) {
      badgeState = {
        kind: "initializing",
      };
    } else if (this.refreshing) {
      badgeState = {
        kind: "reloading",
        unreviewedPullRequestCount: unreviewedPullRequests.length,
      };
    } else {
      badgeState = {
        kind: "loaded",
        unreviewedPullRequestCount: unreviewedPullRequests.length,
      };
    }
    this.context.badger.update(badgeState);
  }

  triggerBackgroundRefresh() {
    this.context.messenger.send({
      kind: "refresh",
    });

    // Note: this is a hack in place because outside of a Chrome extension (ie
    // when developing with webpack dev server), we don't have a background
    // script that will refresh.
    if (process.env.NODE_ENV === "development") {
      this.refreshPullRequests().catch(console.error);
    }
  }

  private triggerReload() {
    this.context.messenger.send({
      kind: "reload",
    });
  }
}
