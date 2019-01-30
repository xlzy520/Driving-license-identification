<template>
  <div class="xlz-header">
    <span class="xlz-header-title">
      <img src="../../../build/icons/256x256.png" width="32" height="32">
      萧玲芝
    </span>
    <div class="xlz-header-menu">
      <div v-for="menuItem in menu" :title="menuItem.title" @click="dispatchMenu(menuItem.click)" class="xlz-header-menu-item">
        <md-icon>{{menuItem.icon}}</md-icon>
      </div>
    </div>
  </div>
</template>

<script>
  import { ipcRenderer } from 'electron';

  export default {
    name: 'xlz-header',
    data() {
      return {
        isMaximized: true,
        menu: [
          { title: '最小化', click: 'minimize', icon: 'remove' },
          { title: '最大化', click: 'maximize', icon: 'crop_din' },
          { title: '关闭', click: 'close', icon: 'clear' },
        ],
      };
    },
    methods: {
      dispatchMenu(menuItem) {
        this[menuItem]();
      },
      close() {
        ipcRenderer.send('close');
      },
      minimize() {
        ipcRenderer.send('min');
      },
      maximize() {
        // ipcRenderer.send('isMaximized');
        // ipcRenderer.on('isMaximized-from-main', (event, arg) => {
        //   this.isMaximized = arg;
        // });
        ipcRenderer.send('max');
        const { icon } = this.menu[1];
        const newIcon = icon === 'crop_din' ? { title: '向下还原', icon: 'filter_none' } : { title: '最大化', icon: 'crop_din' };
        Object.assign(this.menu[1], newIcon);
      },
    },
  };
</script>

<style lang="scss">
  .xlz-header {
    width: 100%;
    height: 40px;
    line-height: 40px;
    background-color: rgba(190, 159, 253, 1);
    display: flex;
    justify-content: space-between;
    color: #fff;
    &-title {
      font-size: 16px;
      padding-left: 20px;
      cursor: default;
      user-select: none;
      img{
        vertical-align: middle;
      }
    }
    &-menu {
      -webkit-app-region: no-drag;
      display: flex;
      justify-content: space-around;
      cursor: default;
      &-item{
        padding: 0 10px;
        &:hover {
          background-color: rgba(185, 0, 154,1);
        }
      }
      .md-icon {
        color: #fff!important;
        padding: 5px;
      }
    }
  }
</style>
