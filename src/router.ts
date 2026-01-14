import { goToTab } from '@/lib/utils'
import { IS_DEV } from '@/data/config'
import * as VueRouter from 'vue-router'
import { assetList } from '@/lib/balance'
import { needMigrate } from './lib/migrate'
import { hasPassword } from './lib/password'
import Wallet from './pages/wallet/Index.vue'
import { getPassword, isLocked } from './lib/lock'
import { getCurrentAccountId } from './lib/account'
import { getCurrentWalletId, hasWallets } from './lib/wallet'

const routes = [
  {
    path: '/',
    redirect: '/wallet',
    component: () => import('./App.vue'),
    children: [
      {
        path: '/wallet/init-service',
        component: () => import('./pages/wallet/InitService.vue'),
        meta: {
          noFooter: true,
          noMenu: true,
        },
      },
      {
        path: '/migrateV2',
        component: () => import('./pages/migrateV2/Index.vue'),
        name: 'migrateV2',
        meta: {
          noFooter: true,
          noMenu: true,
        },
      },
      {
        path: '/lock',
        component: () => import('./pages/lock/Index.vue'),
        meta: {
          noFooter: true,
          noMenu: true,
        },
      },
      {
        path: '/authorize',
        component: () => import('./pages/authorize/Index.vue'),
        meta: {
          noFooter: true,
          noMenu: true,
        },
      },
      {
        path: '/wallet/create',
        component: () => import('./pages/wallet/Create.vue'),
        meta: {
          noFooter: true,
        },
      },
      {
        path: '/wallet/backup',
        component: () => import('./pages/wallet/Backup.vue'),
        meta: {
          noFooter: true,
        },
      },
      {
        path: '/wallet/check-backup',
        component: () => import('./pages/wallet/CheckBackup.vue'),
        meta: {
          noFooter: true,
        },
      },
      {
        path: '/wallet/set-password',
        component: () => import('./pages/wallet/SetPassword.vue'),
        meta: {
          noFooter: true,
          noMenu: true,
        },
      },
      {
        path: '/wallet/small-payment-auto-approve',
        component: () => import('./pages/wallet/SmallPaymentAutoApprove.vue'),
        meta: {
          noFooter: true,
          noMenu: true,
        },
      },
      {
        path: '/wallet/recovery-password',
        component: () => import('./pages/wallet/RecoveryPassword.vue'),
        meta: {
          noFooter: true,
          noMenu: true,
        },
      },
      {
        path: '/wallet/create-success',
        component: () => import('./pages/wallet/CreateSuccess.vue'),
        meta: {
          noFooter: true,
          noMenu: true,
        },
      },
      {
        path: '/wallet/receive/:symbol/:address',
        component: () => import('./pages/wallet/Receive.vue'),
        name: 'receive',
        meta: {
          noFooter: true,
        },
      },
      {
        path: '/wallet/receive/:coinCategory/:symbol/:address',
        component: () => import('./pages/wallet/Receive.vue'),
        meta: {
          noFooter: true,
        },
      },
      {
        path: '/wallet/send/:symbol/:address',
        component: () => import('./pages/wallet/Send.vue'),
        name: 'send',
        meta: {
          noFooter: true,
          headerTitle: 'Send',
          headerTitleKey: 'Common.Send',
        },
      },
      {
        path: '/wallet/swap/:chain?/:protocol?/:pair?',
        component: () => import('./pages/wallet/Swap/Index.vue'),
        name: 'Swap',
        meta: {
          noFooter: true,
          headerTitle: 'Swap',
          headerTitleKey: 'Common.Swap',
        },
      },
      {
        path: '/wallet/bridge/:protocol?/:pair?',
        component: () => import('./pages/wallet/Bridge/Index.vue'),
        name: 'Bridge',
        meta: {
          noFooter: true,
          headerTitle: 'Bridge',
          headerTitleKey: 'Common.Bridge',
        },
      },
      {
        path: '/wallet/sendBRC20/:symbol/:amount/:address/:inscriptionId',
        component: () => import('./pages/wallet/SendBRC20.vue'),
        name: 'sendBRC20',
        meta: {
          noFooter: true,
          headerTitle: 'Send',
          headerTitleKey: 'Common.Send',
        },
      },
      {
        path: '/wallet/sendRune/:name/:runeId/:address',
        component: () => import('./pages/wallet/SendRune.vue'),
        name: 'SendRune',
        meta: {
          noFooter: true,
          headerTitle: 'Send',
          headerTitleKey: 'Common.Send',
        },
      },
      {
        path: '/wallet/sendMRC20/:name/:mrc20Id/:address',
        component: () => import('./pages/wallet/SendMRC20.vue'),
        name: 'SendMRC20',
        meta: {
          headerTitle: 'Send',
          headerTitleKey: 'Common.Send',
          noFooter: true,
        },
      },
      {
        path: '/wallet/teleportMRC20/:name/:mrc20Id/:fromChain',
        component: () => import('./pages/wallet/TeleportMRC20.vue'),
        name: 'TeleportMRC20',
        meta: {
          headerTitle: 'Teleport',
          noFooter: true,
        },
      },
      {
        path: '/wallet/teleportSuccess/:fromChain/:toChain/:symbol/:amount/:transferTxId/:arrivalTxId',
        component: () => import('./pages/wallet/TeleportSuccess.vue'),
        name: 'TeleportSuccess',
        meta: {
          headerTitle: 'Teleport Success',
          noFooter: true,
        },
      },
      {
        path: '/wallet/mintRune/:name/:runeId/:address',
        component: () => import('./pages/wallet/MintRune.vue'),
        name: 'MintRune',
        meta: {
          headerTitle: 'Mint',
          headerTitleKey: 'Common.Mint',
          noFooter: true,
        },
      },
      {
        path: '/wallet/mintMRC20/:name/:mrc20Id/:address',
        component: () => import('./pages/wallet/MintMRC20.vue'),
        name: 'MintMRC20',
        meta: {
          headerTitle: 'Mint',
          headerTitleKey: 'Common.Mint',
          noFooter: true,
        },
      },
      {
        path: '/wallet/sendSuccess/:chain/:coinCategory/:symbol/:amount/:address/:txId',
        component: () => import('./pages/wallet/SendSuccess.vue'),
        name: 'SendSuccess',
        meta: {
          noFooter: true,
        },
      },
      {
        path: '/wallet/inscribe/:symbol/:address',
        component: () => import('./pages/wallet/Inscribe.vue'),
        name: 'inscribe',
        meta: {
          headerTitle: 'Inscribe Transfer',
          headerTitleKey: 'Common.InscribeTransfer',
          noFooter: true,
        },
      },
      {
        path: '/wallet/transfer/:symbol/:address',
        component: () => import('./pages/wallet/Transfer.vue'),
        name: 'transfer',
        meta: {
          headerTitle: 'Transfer',
          headerTitleKey: 'Common.Transfer',
          noFooter: true,
        },
      },
      {
        path: '/wallet/inscribe-success/:symbol/:orderId',
        component: () => import('./pages/wallet/InscribeSuccess.vue'),
        name: 'inscribe-success',
        meta: {
          noFooter: true,
        },
      },
      {
        path: '/wallet/inscribe-query/:symbol/:amt/:orderId',
        component: () => import('./pages/wallet/InscribeQuery.vue'),
        name: 'inscribe-query',
        meta: {
          noFooter: true,
        },
      },
      {
        path: '/wallet/send-token/:symbol/:address/:codeHash/:genesis',
        component: () => import('./pages/wallet/SendToken.vue'),
        name: 'send-token',
        meta: {
          headerTitle: 'Send',
          headerTitleKey: 'Common.Send',
          noFooter: true,
        },
      },
      {
        path: '/wallet/select-asset/:purpose',
        component: () => import('./pages/wallet/SelectAsset.vue'),
        name: 'select-asset',
        meta: {
          headerTitle: 'Select Asset',
          headerTitleKey: 'HeaderTitle.SelectAsset',
          noFooter: true,
        },
      },
      {
        path: '/wallet/connect-site',
        component: () => import('./pages/wallet/ConnectSite.vue'),
        name: 'connect-site',
        meta: {
          headerTitle: 'Connect',
          headerTitleKey: 'Common.Connect',
          noFooter: true,
        },
      },
      {
        path: '/wallet/select-network',
        component: () => import('./pages/wallet/SelectNetwork.vue'),
        meta: {
          headerTitle: 'Select Network',
          headerTitleKey: 'HeaderTitle.SelectNetwork',
          noFooter: true,
        },
      },
      {
        path: '/wallet/manage-assets',
        component: () => import('./pages/wallet/ManageAssets.vue'),
        meta: {
          headerTitle: 'Manage Assets',
          headerTitleKey: 'HeaderTitle.ManageAssets',
          noFooter: true,
        },
      },
      {
        path: '/wallet/asset/:symbol/:address',
        component: () => import('./pages/wallet/Asset.vue'),
        name: 'asset',
        props: true,
        meta: {
          noFooter: true,
          backRouter: '/wallet',
        },
      },
      {
        path: '/wallet/brc20/:symbol/:address',
        component: () => import('./pages/wallet/BRC20.vue'),
        name: 'brc20',
        props: true,
        meta: {
          secondaryHeader: true,
          headerTitle: 'BRC20',
          noFooter: true,
          backRouter: '/wallet',
        },
      },
      {
        path: '/wallet/rune/:name/:symbol/:runeId/:address',
        component: () => import('./pages/wallet/Rune.vue'),
        name: 'rune-detail',
        props: true,
        meta: {
          secondaryHeader: true,
          headerTitle: 'Rune',
          noFooter: true,
          backRouter: '/wallet',
        },
      },
      {
        path: '/wallet/mrc20/:name/:symbol/:mrc20Id/:address',
        component: () => import('./pages/wallet/MRC20.vue'),
        name: 'mrc20-detail',
        props: true,
        meta: {
          secondaryHeader: true,
          headerTitle: 'MRC20',
          noFooter: true,
          backRouter: '/wallet',
        },
      },
      {
        path: '/wallet/tokens/:address/:symbol/:codeHash/:genesis',
        component: () => import('./pages/wallet/Token.vue'),
        name: 'token',
        meta: {
          secondaryHeader: true,
          headerTitle: 'ASSET',
          noFooter: true,
          backRouter: '/wallet',
        },
      },
      {
        path: '/wallet',
        component: Wallet,
        meta: {
          noFooter: true,
          noMenu: true,
        },
      },
      {
        name: 'brc20Detail',
        path: '/nft/brc20/detail/:address/:inscriptionId',
        component: () => import('./pages/nfts/BRCTokenDetail.vue'),
        meta: {
          secondaryHeader: true,
          noFooter: true,
        },
      },
      {
        name: 'metaPinDetail',
        path: '/nft/metaPin/detail/:address/:metaPinId',
        component: () => import('./pages/nfts/MetaPinDetail.vue'),
        meta: {
          secondaryHeader: true,
          noFooter: true,
        },
      },
      {
        name: 'mrc721Detail',
        path: '/nft/mrc721/detail/:address/:metaPinId',
        component: () => import('./pages/nfts/MRC721Detail.vue'),
        meta: {
          secondaryHeader: true,
          noFooter: true,
        },
      },
      {
        name: 'mrc721Collection',
        path: '/nft/mrc721/collection/:pinId',
        component: () => import('./pages/nfts/MRC721Collection.vue'),
        meta: {
          secondaryHeader: true,
          headerTitle: 'Collection',
          headerTitleKey: 'Common.Collection',
          noFooter: true,
        },
      },
      {
        name: 'sendNFT',
        path: '/nft/sendNFT/:nftType/:address/:id',
        component: () => import('./pages/nfts/SendNFT.vue'),
        meta: {
          secondaryHeader: true,
          headerTitle: 'Send NFT',
          noFooter: true,
        },
      },
      {
        path: '/nfts/transfer-nft/:codehash/:genesis/:tokenIndex',
        component: () => import('./pages/nfts/Transfer.vue'),
        name: 'transfer-nft',
        props: (route: any) => ({
          codehash: route.params.codehash,
          genesis: route.params.genesis,
          tokenIndex: Number(route.params.tokenIndex),
        }),
        meta: {
          secondaryHeader: true,
          headerTitle: 'Transfer NFT',
          noFooter: true,
        },
      },
      {
        path: '/nfts/:codehash/:genesis/:tokenIndex',
        component: () => import('./pages/nfts/Detail.vue'),
        name: 'nft-detail',
        props: (route: any) => ({
          codehash: route.params.codehash,
          genesis: route.params.genesis,
          tokenIndex: Number(route.params.tokenIndex),
        }),
        meta: {
          secondaryHeader: true,
          noFooter: true,
        },
      },

      { path: '/tokens', component: () => import('./pages/tokens/Index.vue') },
      {
        path: '/settings',
        component: () => import('./pages/settings/Index.vue'),
        meta: {
          secondaryHeader: true,
          headerTitle: 'Setting',
          headerTitleKey: 'Common.Setting',
          noFooter: true,
        },
      },
      {
        path: '/accounts',
        component: () => import('./pages/accounts/Index.vue'),
        meta: {
          secondaryHeader: true,
          headerTitle: 'Accounts',
          noFooter: true,
        },
      },

      {
        path: '/settings/current-account',
        component: () => import('./pages/settings/CurrentAccount.vue'),
        meta: {
          secondaryHeader: true,
          headerTitle: 'Current Account',
          noFooter: true,
        },
      },
      {
        path: '/settings/address-type',
        component: () => import('./pages/settings/AddressType.vue'),
        meta: {
          secondaryHeader: true,
          headerTitle: 'BTC Address Type',
          noFooter: true,
        },
      },
      {
        path: '/settings/security-lab',
        component: () => import('./pages/settings/SecurityLab.vue'),
        meta: {
          secondaryHeader: true,
          headerTitle: 'Security Lab',
          noFooter: true,
        },
      },
      {
        path: '/settings/toolkit',
        component: () => import('./pages/settings/Toolkit.vue'),
        meta: {
          secondaryHeader: true,
          headerTitle: 'Toolkit',
          headerTitleKey: 'Common.Toolkit',
          noFooter: true,
        },
      },
      {
        path: '/settings/toolkit/btc-merge',
        component: () => import('./pages/settings/components/BTCMerge.vue'),
        meta: {
          secondaryHeader: true,
          headerTitle: 'BTC Merge',
          headerTitleKey: 'HeaderTitle.BTCMerge',
          noFooter: true,
        },
      },
      {
        path: '/settings/toolkit/space-merge',
        component: () => import('./pages/settings/components/SpaceMerge.vue'),
        meta: {
          secondaryHeader: true,
          headerTitle: 'Space Merge',
          headerTitleKey: 'HeaderTitle.SpaceMerge',
          noFooter: true,
        },
      },
      {
        path: '/settings/toolkit/ft-merge',
        name: 'ft-merge',
        component: () => import('./pages/settings/components/FTMerge.vue'),
        meta: {
          headerTitle: 'Ft Merge',
          headerTitleKey: 'HeaderTitle.FtMerge',
          noFooter: true,
        },
      },
      {
        path: '/settings/about',
        component: () => import('./pages/settings/About.vue'),
        meta: {
          noFooter: true,
        },
      },
      {
        path: '/settings/security',
        component: () => import('./pages/settings/Security.vue'),
        meta: {
          secondaryHeader: true,
          headerTitle: 'Wallet Security',
          headerTitleKey: 'HeaderTitle.WalletSecurity',
          noFooter: true,
        },
      },
      {
        path: '/tools/path-finder',
        component: () => import('./pages/tools/PathFinder.vue'),
        meta: {
          headerTitle: 'Path Finder',
          headerTitleKey: 'HeaderTitle.PathFinder',
          noFooter: true,
        },
      },
      {
        path: '/manage/wallets',
        name: 'manage-wallets',
        component: () => import('./pages/manage/Index.vue'),
        meta: {
          noFooter: true,
        },
      },
      {
        path: '/edit/wallets',
        name: 'edit-wallets',
        component: () => import('./pages/manage/Edit.vue'),
        meta: {
          noFooter: true,
        },
      },
    ],
  },
  {
    path: '/welcome',
    component: () => import('./pages/welcome/Index.vue'),
    children: [
      { path: '', component: () => import('./pages/welcome/Home.vue') },
      { path: 'import', component: () => import('./pages/welcome/Import.vue') },
      { path: 'create', component: () => import('./pages/welcome/Create.vue') },
    ],
  },
  {
    path: '/test',
    component: () => import('./pages/tests/Index.vue'),
  },
  {
    path: '/test/doge-inscribe',
    component: () => import('./pages/tests/DogeInscribe.vue'),
  },
  {
    path: '/test/create-pin',
    component: () => import('./pages/tests/CreatePin.vue'),
  },
]

const historyMode = IS_DEV ? VueRouter.createWebHistory() : VueRouter.createWebHashHistory()
const router = VueRouter.createRouter({
  history: historyMode,
  routes,
})

const welcomePages = ['/welcome', '/welcome/import', '/welcome/create']

const authPages = [
  ...welcomePages,
  '/lock',
  '/accounts',
  '/migrateV2',
  '/manage/wallets',
  '/wallet/set-password',
  '/wallet/recovery-password',
]

router.beforeEach(async (to, _, next) => {
  const _isLocked = await isLocked()
  const password = await getPassword()
  const _hasWallets = await hasWallets()
  const _hasPassword = await hasPassword()
  const _needMigrate = await needMigrate()

  if (to.fullPath !== '/wallet/recovery-password' && !_hasPassword && (_needMigrate || _hasWallets)) {
    next('/wallet/recovery-password')
  } else if (to.fullPath !== '/lock' && _hasPassword && (!password || _isLocked)) {
    next('/lock')
  } else if (to.fullPath !== '/migrateV2' && _hasPassword && !_isLocked && password && _needMigrate) {
    next('/migrateV2')
  } else if (!authPages.includes(to.path)) {
    if (!_hasWallets) {
      next()
      goToTab('/welcome', true)
    } else if (!(await getCurrentAccountId()) || !(await getCurrentWalletId())) {
      next('/manage/wallets')
    } else {
      if (['token', 'brc20'].includes(to.name as string)) {
        to.meta.headerTitle = to.params.symbol
      } else if (['rune'].includes(to.name as string)) {
        to.meta.headerTitle = to.params.name
      } else if (to.name === 'rune-detail') {
        to.meta.headerTitle = to.params.name
      } else if (to.name === 'send-token') {
        to.meta.headerTitle = `Send ${to.params.symbol}`
      } else if (to.name === 'mrc20-detail') {
        to.meta.headerTitle = `${to.params.symbol}`
      } else if (to.name === 'SendMRC20') {
        to.meta.headerTitle = `Send ${to.params.name}`
      } else if (to.name === 'SendRune') {
        to.meta.headerTitle = `Send ${to.params.name}`
      } else if (to.name === 'MintRune') {
        to.meta.headerTitle = `Mint ${to.params.name}`
      }

      if (to.path === '/wallet') {
        assetList.value = []
      }
      next()
    }
  } else {
    next()
  }
})

export default router
