<template>
  <md-tabs class="home-nav" md-alignment="centered">
    <md-tab id="tab-home" md-label="行驶证"></md-tab>
  </md-tabs>
</template>

<script>
export default {
  name: 'xlz-nva',
  data() {
    return {
    };
  },
};
</script>

<style lang="scss">
  .home-nav{
    -webkit-app-region: no-drag;
    background-color: #fbd7d7;
    .md-button{
      font-size: 16px;
      font-weight: 500;
    }
  }
</style>
