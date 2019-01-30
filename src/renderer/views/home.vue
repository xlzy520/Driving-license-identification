<template>
  <div class="home">
    <xlz-header></xlz-header>
    <xlz-nva></xlz-nva>
    <router-view></router-view>
  </div>
</template>

<script>
  import XlzNva from '@/components/Nva';
  import XlzHeader from '@/components/Header';
  import getAccessToken from '@/utils/getAccessToken';
  export default {
    name: 'home',
    components: { XlzNva, XlzHeader },
    data() {
      return {};
    },
    mounted() {
      getAccessToken();
    },
  };
</script>

<style lang="scss">
  .home{
    height: 100%;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }
</style>
