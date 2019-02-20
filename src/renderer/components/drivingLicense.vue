<template>
  <div class="driving-license">
    <div class="driving-license-header">
      <div class="driving-license-fileDetail">
        <p>选择的文件夹路径：{{filePath}}</p>
        <p>图片数量：{{images.length}}</p>
        <p>其他文件类型数量：{{otherTypeCount}}</p>
        <p>识别完成的图片数量：{{imgCompletedCount}}</p>
        <p v-show="errorImg.length>0">
          识别失败的图片数量：{{errorImg.length}}
          <md-button class="md-raised md-mini md-accent open-error-dir" @click="openDir('error')">打开失败文件夹</md-button></p>
      </div>
      <div class="driving-license-run" v-show="filePath.length>0" >
        <md-button class="md-raised md-primary" @click="run" v-show="!complete">
          <md-progress-spinner
              v-show="reading"
              md-mode="indeterminate"
              class="md-primary md-light-green"
              style="vertical-align: middle"
              :md-diameter="20"
              :md-stroke="2"></md-progress-spinner>
          {{reading?'正在识别并重命名':'开始识别并重命名'}}
        </md-button>
        <md-button class="md-raised md-accent" @click="init">重新选择文件夹</md-button>
        <md-button class="md-raised md-accent" style="background-color: #24c121" @click="openDir('result')" v-show="complete" >打开完成结果目录</md-button>
      </div>
    </div>
    <div class="driving-license-select" v-show="filePath.length===0">
      <md-button class="md-primary" @click="openDirectory">
        <md-icon class="md-size-3x">cloud_upload</md-icon>
        <div class="tips">请选择文件夹</div>
      </md-button>
    </div>
    <div class="driving-license-content md-scrollbar" v-show="filePath.length>0" ref="driving">
      <div v-for="(img,index) in images" :class="['img-item', imgFlag(img)]" @click="viewImg(img)">
        <img :src="filePath+'/'+ img.name" :title="img.name" width="64">
        <p>{{img.name}}</p>
        <md-progress-bar md-mode="indeterminate" v-show="index<intervalProgress && img.success=== null"></md-progress-bar>
      </div>
    </div>
    <md-dialog-alert
        :md-active.sync="completeDialog"
        :md-content="'全部完成!'+errorImg.length+'个错误'"/>
  </div>
</template>

<script>
  const { dialog, shell } = require('electron').remote;
  const fs = require('fs');
  export default {
    name: 'driving-license',
    data() {
      return {
        filePath: '',
        images: [],
        otherTypeCount: 0,
        complete: false,
        completeDialog: false,
        errorImg: [],
        intervalProgress: 0,
        imgCompletedCount: 0,
      };
    },
    computed: {
      reading() {
        return !this.complete && this.imgCompletedCount < this.images.length
            && this.intervalProgress > 0;
      },
    },
    methods: {
      imgFlag(img) {
        if (img.success === true) {
          return 'success-flag';
        } else if (img.success === false) {
          return 'failure-flag';
        }
        return '';
      },
      openDirectory() {
        dialog.showOpenDialog({ properties: ['openDirectory'] }, (filePaths, err) => {
          if (err) throw err;
          this.filePath = filePaths[0];
          const files = fs.readdirSync(filePaths[0]);
          this.images = this.filterImgFile(files);
          this.otherTypeCount = files.length - this.images.length;
        });
      },
      filterImgFile(files) {
        const imgNames = files.filter(item => (/\.[jpg][png][jpeg]$/g).test(item));
        return imgNames.map(item => ({ name: item, success: null }));
      },
      viewImg(img) {
        shell.openItem(`${this.filePath}/${img.name}`);
      },
      init() {
        this.filePath = '';
        this.images = [];
        this.errorImg = [];
        this.otherTypeCount = 0;
        this.complete = false;
        this.intervalProgress = 0;
        this.imgCompletedCount = 0;
      },
      run() {
        if (this.intervalProgress === 0) {
          const accessToken = sessionStorage.getItem('accessToken');
          const { length: max } = this.images;
          if (accessToken) {
            this.intervalProgress = 1;
            this.postImg(accessToken, 0); // 直接进入loading，避免进入定时器而延迟
            let i = 1;
            const renameTime = setInterval(() => {
              if (i < max) {
                this.postImg(accessToken, i);
                i += 1;
                this.intervalProgress += 1;
              } else {
                clearInterval(renameTime);
              }
            }, 1200);
          }
        }
      },
      postImg(token, i) {
        const { name } = this.images[i];
        const imgExt = name.substring(name.lastIndexOf('.'));
        const imagePath = `${this.filePath}/${name}`;
        const imageBuf = fs.readFileSync(imagePath);
        const imgBase64 = imageBuf.toString('base64');
        this.$http({
          method: 'post',
          url: `/vehicle_license?access_token=${token}`,
          data: `image=${encodeURIComponent(imgBase64)}&detect_direction=true`,
        })
          .then((res) => {
            const imgIndex = this.images.findIndex(item => item.name === name);
            if (res.data.error_code || res.data.words_result['所有人'].words === '') {
              this.images[imgIndex].success = false;
              this.errorImg.push(name);
              this.copyErrImg(imagePath, name, imgExt);
            } else {
              this.images[imgIndex].success = true;
              this.rename(imagePath, imgExt, res.data);
            }
            this.imgCompletedCount += 1; // 判断全部图片识别完成的标志
            if (this.imgCompletedCount % 10 === 0) {
              this.$refs.driving.scrollTop += 129;
            }
            if (this.imgCompletedCount === this.images.length) {
              this.complete = true;
              this.completeDialog = true;
            }
          });
      },
      copyErrImg(imagePath, imgName, imgExt) {
        const basePath = `${this.filePath}\\识别失败\\`;
        if (!fs.existsSync(basePath)) {
          fs.mkdirSync(basePath, (err) => {
            if (err) throw err;
          });
        }
        fs.copyFileSync(imagePath, `${basePath}${imgName}${imgExt}`);
      },
      rename(imagePath, imgExt, data) {
        const ownerName = data.words_result['所有人'].words;
        const basePath = `${this.filePath}\\完成结果\\`;
        if (!fs.existsSync(basePath)) {
          fs.mkdirSync(basePath, (err) => {
            if (err) throw err;
          });
        }
        if (ownerName.length > 0) {
          fs.access(`${basePath}${ownerName}${imgExt}`, fs.constants.F_OK, (err) => {
            const resultName = err ? '' : `-重名${new Date().getMinutes()}-${new Date().getSeconds()}`;
            fs.copyFileSync(imagePath, `${basePath}${ownerName}${resultName}${imgExt}`);
          });
        } else {
          throw new Error('识别失败！');
        }
      },
      openDir(flag) {
        switch (flag) {
          case 'result':
            shell.openItem(`${this.filePath}\\完成结果\\`);
            break;
          case 'error':
            shell.openItem(`${this.filePath}\\识别失败\\`);
            break;
          default:
            break;
        }
      },
    },
  };
</script>

<style lang="scss">
  .driving-license{
    -webkit-app-region: no-drag;
    padding: 10px 30px;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    align-items: center;
    overflow-y: auto;
    &-select{
      .md-button{
        width: 32vw;
        height: 48vh!important;
        border: 2px dotted #968fbf;
        border-radius: 10px;
      }
      .tips{
        font-size: 27px;
      }
    }
    &-fileDetail{
      color: #ff008b;
      p{
        padding-bottom: 5px;
      }
      .open-error-dir{
        line-height: 25px;
        height: 25px;
        vertical-align: middle;
        margin: 0;
      }
    }
    &-header{
      display: flex;
      justify-content: space-between;
      width: 100%;
    }
    &-content{
      width: 100%;
      display: flex;
      overflow-y: auto;
      overflow-x: hidden;
      flex-wrap: wrap;
      height: 70vh;
      margin-top: 15px;
      .img-item{
        position: relative;
        margin-left: 27px;
        width: 64px;
        cursor: pointer;
        img{
          height: 85.33px;
        }
        &::before{
          content: "";
          display: block;
          position: relative;
          top: 13px;
          left: 50px;
          border-radius: 50%;
          font-size: 20px;
          width: 24px;
          height: 24px;
          line-height: 24px;
          text-indent: 5px;
        }
        &.success-flag::before, &.failure-flag::before{
          background-color: #fff;
        }
        &.success-flag::before{
          content: "√";
          color: limegreen;
          border: 1px solid #65ad74;
        }
        &.failure-flag::before{
          content: "X";
          color: #ff3e31;
          border: 1px solid #ff5d54;
        }
        p{
          width: 64px;
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow: hidden;
        }
        .md-progress-bar{
          bottom: 25px;
        }
        .read_success{
          position: relative;
          bottom: 221px;
          left: 86px;
          color: #33ff9b;
        }
      }
    }
    .md-card{
      width: 160px;
      padding: 15px 10px 0;
      border-radius: 4px;
    }
  }
</style>
<style lang="scss" scoped>
  /deep/ .md-progress-spinner.md-theme-default .md-progress-spinner-circle {
    stroke: #10ff19;
  }
</style>
