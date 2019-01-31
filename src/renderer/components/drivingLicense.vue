<template>
  <div class="driving-license">
    <div class="driving-license-help">
      <div class="driving-license-fileDetail">
        <p>选择的文件夹路径：{{filePath}}</p>
        <p>图片数量：{{images.length}}</p>
        <p>其他文件类型数量：{{otherTypeCount}}</p>
      </div>
      <md-card md-with-hover @click.native="hideHelp" v-show="helpVisible&&filePath.length===0">
        <md-content>
          批量识别行驶证图片，并将行驶证姓名重命名该图片。
          请勿使用中文命名文件夹！
        </md-content>
      </md-card>
      <div class="driving-license-run" v-show="filePath.length>0">
        <md-button class="md-raised md-primary" @click="run" v-show="!openResultDirButton">开始识别并重命名</md-button>
        <md-button class="md-raised md-accent" @click="reset">返回首页</md-button>
        <md-button class="md-raised md-accent" style="background-color: #24c121" @click="openResultDir" v-show="openResultDirButton" >打开完成结果目录</md-button>
      </div>
    </div>
    <div class="driving-license-select" v-show="filePath.length===0">
      <md-button class="md-primary" @click="openDirectory">
        <md-icon class="md-size-3x">cloud_upload</md-icon>
        <div class="tips">请选择文件夹</div>
      </md-button>
    </div>
    <div class="driving-license-content md-scrollbar"  v-show="filePath.length>0">
      <div v-for="img in images" class="img-item" @click="viewImg(img)">
        <img :src="filePath+'/'+ img" :title="img">
        <p>{{img}}</p>
        <!--<md-icon class="md-size-2x read_success" v-show="">verified_user</md-icon>-->
        <md-progress-bar md-mode="indeterminate" v-show="img === currentImg"></md-progress-bar>
      </div>
    </div>
    <md-dialog-alert
        :md-active.sync="complete"
        md-content="全部完成!"/>
  </div>
</template>

<script>
  const { dialog, shell } = require('electron').remote;
  const fs = require('fs');
  export default {
    name: 'driving-license',
    data() {
      return {
        helpVisible: true,
        filePath: '',
        images: [],
        otherTypeCount: 0,
        allPeople: [],
        currentImg: '',
        complete: false,
        openResultDirButton: false,
      };
    },
    methods: {
      openDirectory() {
        dialog.showOpenDialog({ properties: ['openDirectory'] }, (filePaths, err) => {
          if (err) throw err;
          this.filePath = filePaths[0];
          const files = fs.readdirSync(filePaths[0]);
          this.images = this.hasOtherTypeFile(files);
          this.otherTypeCount = files.length - this.images.length;
        });
      },
      hasOtherTypeFile(files) {
        return files.filter(item => (/\.[jpg][png][jpeg]$/g).test(item));
      },
      hideHelp() {
        this.helpVisible = false;
      },
      viewImg(img) {
        shell.openItem(`${this.filePath}/${img}`);
      },
      reset() {
        this.filePath = '';
        this.images = [];
        this.otherTypeCount = 0;
        this.currentImg = '';
        this.allPeople = [];
        this.openResultDirButton = false;
        this.complete = false;
      },
      run() {
        const accessToken = sessionStorage.getItem('accessToken');
        if (accessToken) {
          this.postImg(accessToken);
        }
      },
      postImg(token) {
        // const imgExt = this.images[i].substring(this.images[i].lastIndexOf('.'));
        // const imagePath = `${this.filePath}\\${this.images[i]}`;
        // const imageBuf = fs.readFileSync(imagePath);
        // const imgBase64 = imageBuf.toString('base64');
        // const data = {
        //   words_result: {
        //     所有人: {
        //       words: '吕宗远',
        //     },
        //   },
        // };
        // this.rename(imagePath, imgExt, data);
        let i = 0;
        const renameTime = setInterval(() => {
          if (i < this.images.length) {
            this.currentImg = this.images[i];
            const imgExt = this.images[i].substring(this.images[i].lastIndexOf('.'));
            const imagePath = `${this.filePath}/${this.images[i]}`;
            const imageBuf = fs.readFileSync(imagePath);
            const imgBase64 = imageBuf.toString('base64');
            this.$http({
              method: 'post',
              url: `/vehicle_license?access_token=${token}`,
              data: `image=${encodeURIComponent(imgBase64)}&detect_direction=true`,
            }).then((res) => {
              if (res.data) {
                this.allPeople.push(res.data);
                this.rename(imagePath, imgExt, res.data);
              }
            });
            i += 1;
          } else {
            this.currentImg = '';
            this.openResultDirButton = true;
            this.complete = true;
            clearInterval(renameTime);
          }
        }, 1000);
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
      openResultDir() {
        shell.openItem(`${this.filePath}\\完成结果\\`);
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
    }
    &-help{
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
        margin-left: 25px;
        width: 128px;
        cursor: pointer;
        p{
          width: 128px;
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow: hidden;
        }
        .md-progress-bar{
          bottom: 48px;
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
