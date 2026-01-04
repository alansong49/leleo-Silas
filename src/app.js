import homeright from '../src/components/hoemright.vue';
import typewriter from './components/typewriter.vue';
import tab1 from './components/tabs/tab1.vue';
import tab2 from './components/tabs/tab2.vue';
import tab3 from './components/tabs/tab3.vue';
import loader from './components/loader.vue';
import polarchart from './components/polarchart.vue';
import config from './config.js';
import { getCookie } from './utils/cookieUtils.js';
import { setMeta,getFormattedTime,getFormattedDate,dataConsole } from './utils/common.js';
import { commitConfigToGitHub } from './utils/githubApi.js';
import { decrypt } from './utils/encryptUtils.js';
import { useDisplay } from 'vuetify'

export default {
  components: {
    tab1,tab2,tab3,loader,homeright,typewriter,polarchart
  },
  setup() {
    const { xs,sm,md } = useDisplay();
    return { xs,sm,md };
  },
  data() {
    return {
      isloading:false,
      isClearScreen: false,
      formattedTime:"",
      formattedDate:"",
      configdata: config,
      dialog1: false,
      dialog2: false,
      isAdminMode: false,
      adminPasswordDialog: false,
      adminPasswordInput: '',
      passwordError: false,
      showExitAdminDialog: false,
      deleteProjectDialog: false,
      deletingProjectIndex: null,
      githubCommitDialog: false,
      githubToken: decrypt('Cw0cOl8uLgURCgNJFhYfFh08R14DbiMnXCwWCSYXVh4DCEYKBwsLKA=='), // Encrypted token
      showGitHubToken: false,
      githubCommitStatus: null, // null, 'loading', 'success', 'error'
      githubCommitError: '',
      changePasswordDialog: false,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      passwordChangeError: '',
      saveSuccessDialog: false,
      tagsDialog: false,
      editingTags: [],
      newTag: '',
      avatarEditDialog: false,
      newSiteTitle: '',
      newWelcomeTitle: '',
      typewriterEditDialog: false,
      editingTypewriterStrings: [],
      newTypewriterString: '',
      addProjectDialog: false,
      editingProjectIndex: null,
      newProject: {
        go: '',
        img: '',
        title: '',
        subtitle: '',
        text: '',
        url: '',
        show: false
      },
      personalizedtags: null,
      videosrc: '',
      ismusicplayer: false,
      isPlaying:false,
      playlistIndex: 0,
      audioLoading: false,
      musicinfo: null,
      musicinfoLoading:false,
      lyrics:{},
      socialPlatformIcons: null,
      isExpanded: false,
      volume: 50,
      showVolumeSlider: false,
      stackicons:[
        {icon:"mdi-vuejs",color:"green", model: false,tip: 'vue'},
        {icon:"mdi-language-javascript",color:"#CAD300", model: false,tip: 'javascript'},
        {icon:"mdi-language-css3",color:"blue", model: false,tip: 'css'},
        {icon:"mdi-language-html5",color:"red", model: false,tip: 'html'},
        {icon:"$vuetify",color:"#1697F6", model: false,tip: 'vuetify'},
      ],
      projectcards:null,
      tab: null,
      tabs: [
        {
          icon: 'mdi-pencil-plus',
          text: '样式预览',
          value: 'tab-1',
          component: "tab1",
        },
        {
          icon: 'mdi-wallpaper',
          text: '背景预览',
          value: 'tab-2',
          component: "tab2",
        },
        {
          icon: 'mdi-music-circle-outline',
          text: '音乐播放',
          value: 'tab-3',
          component: "tab3",
        },
      ],

    };
  },
  async mounted() {
    if(import.meta.env.VITE_CONFIG){
      this.configdata = JSON.parse(import.meta.env.VITE_CONFIG);
    }
    // 使用深拷贝确保响应式，避免直接引用导致的响应式失效问题
    this.projectcards = JSON.parse(JSON.stringify(this.configdata.projectcards || []));
    this.socialPlatformIcons = this.configdata.socialPlatformIcons;
    this.personalizedtags = this.configdata.tags;
    this.isloading = true;
    let imageurl = "";
    this.dataConsole();
    this.setMeta(this.configdata.metaData.title,this.configdata.metaData.description,this.configdata.metaData.keywords,this.configdata.metaData.icon);
    
    imageurl = this.setMainProperty(imageurl);

    //异步等待背景壁纸包括视频壁纸加载完成后再显示页面
    const loadImage = () => {
        const imageUrls = [
          config.avatar,
          ...config.projectcards.map(item => item.img)
        ];
        return new Promise((resolve, reject) => {
          const imagePromises = imageUrls.map((url) => {
            return new Promise((resolve, reject) => {
                const imgs = new Image();
                imgs.src = url;
                imgs.onload = () => resolve();
                imgs.onerror = (err) => reject(err);
            });
          })

          // 设置超时机制：2.5秒
          const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => {
              resolve();
            }, 2500);
          });
          
          // 等待所有图片加载完成或超时
          Promise.race([Promise.all(imagePromises), timeoutPromise]).then(()=>{
            if(imageurl){
              const img = new Image();
              img.src = imageurl;
              // resolve() 函数通将一个 Promise 对象从未完成状态转变为已完成状态
              img.onload = () => {resolve();};
              img.onerror = (err) => {reject(err);};
            }else{
              const video = this.$refs.VdPlayer;
              video.onloadedmetadata = () => {
                setTimeout(() => {
                }, "200");  
                resolve();
              };
              video.onerror = (err) => {resolve();};
            }
          })
        });
     };

    loadImage().then(() => {
        this.formattedTime =  this.getFormattedTime(new Date());
        this.formattedDate =  this.getFormattedDate(new Date());
        setTimeout(() => {
          this.isloading = false;
        }, "500");          
      }).catch((err) => {
        console.error('壁纸加载失败:', err);
        setTimeout(() => {
          this.isloading = false;
        }, "100");  
      });
 
      setInterval(() => {
        this.formattedTime =  this.getFormattedTime(new Date()) ;
      }, 1000);

      await this.getMusicInfo();  //获取音乐数据
      this.setupAudioListener();  //设置 ended 事件监听器，当歌曲播放结束时自动调用 nextTrack 方法。
      // 初始化音量
      if (this.audioPlayer) {
        this.audioPlayer.volume = this.volume / 100;
      }
  },

  beforeDestroy() {     //在组件销毁前移除事件监听器，防止内存泄漏。
    this.$refs.audioPlayer.removeEventListener('ended',  this.nextTrack);
  },

  watch:{
    isClearScreen(val){
      if(!this.videosrc){
        return
      }
      if(val){
        this.$refs.VdPlayer.style.zIndex = 0; 
        this.$refs.VdPlayer.controls = true;
      }else{
        this.$refs.VdPlayer.style.zIndex = -100; 
        this.$refs.VdPlayer.controls = false;
      }
    },
    audioLoading(val){
      this.isPlaying = !val;
    }

  //若弹出框使得页面播放卡顿，可以先停止背景播放
  //   dialog1(val){
  //     if(val){
  //       this.$refs.VdPlayer.pause();
  //     }else{
  //       this.$refs.VdPlayer.play();
  //     }
  //  }
  },

  computed: {
    currentSong() {
      return this.musicinfo[this.playlistIndex];
    },
    audioPlayer() {
      return this.$refs.audioPlayer;
    }
  },
  
  methods: {
    getCookie,setMeta,getFormattedTime,getFormattedDate,dataConsole,

    setMainProperty(imageurl){
      const root = document.documentElement;
      let leleodata = this.getCookie("leleodata");
      if(leleodata){
        root.style.setProperty('--leleo-welcomtitle-color', `${leleodata.color.welcometitlecolor}`);
        root.style.setProperty('--leleo-vcard-color', `${leleodata.color.themecolor}`);
        root.style.setProperty('--leleo-brightness', `${leleodata.brightness}%`);
        root.style.setProperty('--leleo-blur', `${leleodata.blur}px`); 
      }else{
        root.style.setProperty('--leleo-welcomtitle-color', `${this.configdata.color.welcometitlecolor}`);
        root.style.setProperty('--leleo-vcard-color', `${this.configdata.color.themecolor}`);  
        root.style.setProperty('--leleo-brightness', `${this.configdata.brightness}%`);  
        root.style.setProperty('--leleo-blur', `${this.configdata.blur}px`);
      }
  
      let leleodatabackground = this.getCookie("leleodatabackground");
      const { xs } = useDisplay();
      if(leleodatabackground){
        if(xs.value){
          if(leleodatabackground.mobile.type == "pic"){
            root.style.setProperty('--leleo-background-image-url', `url('${leleodatabackground.mobile.datainfo.url}')`);
            imageurl = leleodatabackground.mobile.datainfo.url;
            return imageurl;
          }else{
            this.videosrc = leleodatabackground.mobile.datainfo.url;
          }
        }else{
          if(leleodatabackground.pc.type == "pic"){
            root.style.setProperty('--leleo-background-image-url', `url('${leleodatabackground.pc.datainfo.url}')`);
            imageurl = leleodatabackground.pc.datainfo.url;
            return imageurl;
          }else{
            this.videosrc = leleodatabackground.pc.datainfo.url;
          }
        }
          
      }else{
        if(xs.value){
          if(this.configdata.background.mobile.type == "pic"){
            root.style.setProperty('--leleo-background-image-url', `url('${this.configdata.background.mobile.datainfo.url}')`);
            imageurl = this.configdata.background.mobile.datainfo.url;
            return imageurl;
          }else{
            this.videosrc = this.configdata.background.mobile.datainfo.url;
          }
        }else{
          if(this.configdata.background.pc.type == "pic"){
            root.style.setProperty('--leleo-background-image-url', `url('${this.configdata.background.pc.datainfo.url}')`);
            imageurl = this.configdata.background.pc.datainfo.url;
            return imageurl;
          }else{
            this.videosrc = this.configdata.background.pc.datainfo.url;
          }
          
        }
      }
    },

    projectcardsShow(key){
      this.projectcards.forEach((item,index)=>{
        if(index!= key){
          item.show = false;
        }
      })
    },
    handleCancel(){
      this.dialog1 = false;
    },
    jump(url){
      window.open(url, '_blank').focus();
    },
    
    async getMusicInfo(){
      this.musicinfoLoading = true;
      try {
        const response = await fetch(`https://api.i-meto.com/meting/api?server=${this.configdata.musicPlayer.server}&type=${this.configdata.musicPlayer.type}&id=${this.configdata.musicPlayer.id}`
        );
        if (!response.ok) {
          throw new Error('网络请求失败');
        }
        this.musicinfo = await response.json();
        this.musicinfoLoading = false;
      } catch (error) {
        console.error('请求失败:', error);
      }
      
    },
    musicplayershow(val) {
        this.ismusicplayer = val;
    },

    setupAudioListener() {
      this.$refs.audioPlayer.addEventListener('ended', this.nextTrack);
    },

    togglePlay() {
      if (!this.isPlaying) {
        this.audioPlayer.play();
        this.isVdMuted = true;
      } else {
        this.audioPlayer.pause();
        this.isVdMuted = false;
      }
      this.isPlaying = !this.musicinfoLoading && !this.isPlaying;
    },
    previousTrack() {
      this.playlistIndex = this.playlistIndex > 0 ? this.playlistIndex - 1 : this.musicinfo.length - 1;
      this.updateAudio();
    },
    nextTrack() {
      this.playlistIndex = this.playlistIndex < this.musicinfo.length - 1 ? this.playlistIndex + 1 : 0;
      this.updateAudio();
    },
    updateAudio() {
      this.audioPlayer.src = this.currentSong.url;
      this.$refs.audiotitle.innerText = this.currentSong.title;
      this.$refs.audioauthor.innerText = this.currentSong.author;
      // 保持音量设置
      this.audioPlayer.volume = this.volume / 100;
      this.isPlaying = true;
      this.audioPlayer.play();
    },
    updateCurrentIndex(index) {
      this.playlistIndex = index;
      this.updateAudio();
    },
    updateIsPlaying(isPlaying) {
      this.isPlaying = isPlaying;
    },
    updateLyrics(lyrics){
      this.lyrics = lyrics;
    },
    // 监听等待事件（缓冲不足）
    onWaiting() {
      this.audioLoading = true;
    },
    // 监听可以播放事件（缓冲足够）
    onCanPlay() {
      this.audioLoading = false;
    },
    expandSwitch() {
      this.isExpanded = true;
    },
    collapseSwitch() {
      this.isExpanded = false;
    },
    toggleVolumeSlider() {
      this.showVolumeSlider = !this.showVolumeSlider;
    },
    updateVolume(value) {
      this.volume = value;
      if (this.audioPlayer) {
        this.audioPlayer.volume = value / 100;
      }
    },
    openTagsDialog() {
      if (!this.isAdminMode) {
        this.showAdminModeRequired();
        return;
      }
      // 深拷贝标签数组用于编辑
      this.editingTags = JSON.parse(JSON.stringify(this.personalizedtags || []));
      this.newTag = '';
      this.tagsDialog = true;
    },
    closeTagsDialog() {
      this.tagsDialog = false;
      this.editingTags = [];
      this.newTag = '';
    },
    addTag() {
      if (this.newTag && this.newTag.trim() !== '') {
        const trimmedTag = this.newTag.trim();
        // 检查是否已存在
        if (!this.editingTags.includes(trimmedTag)) {
          this.editingTags.push(trimmedTag);
          this.newTag = '';
        }
      }
    },
    deleteTag(index) {
      this.editingTags.splice(index, 1);
    },
    updateTag(index) {
      // 更新标签时去除空白
      if (this.editingTags[index]) {
        this.editingTags[index] = this.editingTags[index].trim();
        // 如果为空，删除该标签
        if (this.editingTags[index] === '') {
          this.deleteTag(index);
        }
      }
    },
    saveTags() {
      console.log('saveTags called', { isAdminMode: this.isAdminMode, editingTags: this.editingTags });
      
      if (!this.isAdminMode) {
        this.showAdminModeRequired();
        return;
      }
      // 过滤空标签并保存
      this.personalizedtags = this.editingTags.filter(tag => tag && tag.trim() !== '');
      // 更新配置数据
      this.configdata.tags = this.personalizedtags;
      console.log('Tags saved successfully', { personalizedtags: this.personalizedtags, configdata: this.configdata.tags });
      this.closeTagsDialog();
      this.showSaveSuccessDialog();
    },
    openAdminPasswordDialog() {
      // 如果已经是管理员模式，打开退出确认对话框
      if (this.isAdminMode) {
        this.showExitAdminDialog = true;
        return;
      }
      // 否则打开密码输入对话框
      this.adminPasswordInput = '';
      this.passwordError = false;
      this.adminPasswordDialog = true;
    },
    closeAdminPasswordDialog() {
      this.adminPasswordDialog = false;
      this.adminPasswordInput = '';
      this.passwordError = false;
    },
    verifyAdminPassword() {
      const correctPassword = this.configdata.adminPassword || 'admin';
      if (this.adminPasswordInput === correctPassword) {
        this.isAdminMode = true;
        this.passwordError = false;
        this.closeAdminPasswordDialog();
      } else {
        this.passwordError = true;
        this.adminPasswordInput = '';
      }
    },
    exitAdminMode() {
      this.isAdminMode = false;
      this.showExitAdminDialog = false;
    },
    closeExitAdminDialog() {
      this.showExitAdminDialog = false;
    },
    showAdminModeRequired() {
      this.openAdminPasswordDialog();
    },
    openAddProjectDialog() {
      if (!this.isAdminMode) {
        this.showAdminModeRequired();
        return;
      }
      // 重置编辑索引
      this.editingProjectIndex = null;
      // 重置表单
      this.newProject = {
        go: '',
        img: '',
        title: '',
        subtitle: '',
        text: '',
        url: '',
        show: false
      };
      this.addProjectDialog = true;
    },
    openEditProjectDialog(index) {
      if (!this.isAdminMode) {
        this.showAdminModeRequired();
        return;
      }
      // 设置编辑索引
      this.editingProjectIndex = index;
      // 填充表单数据
      if (this.projectcards && this.projectcards[index]) {
        const project = this.projectcards[index];
        this.newProject = {
          go: project.go || '',
          img: project.img || '',
          title: project.title || '',
          subtitle: project.subtitle || '',
          text: project.text || '',
          url: project.url || '',
          show: project.show || false
        };
      }
      this.addProjectDialog = true;
    },
    closeAddProjectDialog() {
      this.addProjectDialog = false;
      // 重置编辑索引
      this.editingProjectIndex = null;
      // 重置表单
      this.newProject = {
        go: '',
        img: '',
        title: '',
        subtitle: '',
        text: '',
        url: '',
        show: false
      };
      // 清除表单验证
      if (this.$refs.addProjectForm) {
        this.$refs.addProjectForm.resetValidation();
      }
    },
    saveProject() {
      console.log('saveProject called', { isAdminMode: this.isAdminMode, editingProjectIndex: this.editingProjectIndex, newProject: this.newProject });
      
      if (!this.isAdminMode) {
        this.showAdminModeRequired();
        return;
      }
      
      // 手动验证必填字段
      if (!this.newProject.go || !this.newProject.go.trim()) {
        console.log('Validation failed: go is empty');
        return;
      }
      if (!this.newProject.img || !this.newProject.img.trim()) {
        console.log('Validation failed: img is empty');
        return;
      }
      if (!this.newProject.title || !this.newProject.title.trim()) {
        console.log('Validation failed: title is empty');
        return;
      }
      if (!this.newProject.subtitle || !this.newProject.subtitle.trim()) {
        console.log('Validation failed: subtitle is empty');
        return;
      }
      if (!this.newProject.text || !this.newProject.text.trim()) {
        console.log('Validation failed: text is empty');
        return;
      }
      if (!this.newProject.url || !this.newProject.url.trim()) {
        console.log('Validation failed: url is empty');
        return;
      }
      
      console.log('Validation passed, creating project');

      // 创建项目卡片对象
      const project = {
        go: this.newProject.go.trim(),
        img: this.newProject.img.trim(),
        title: this.newProject.title.trim(),
        subtitle: this.newProject.subtitle.trim(),
        text: this.newProject.text.trim(),
        url: this.newProject.url.trim(),
        show: this.newProject.show
      };

      if (this.editingProjectIndex !== null) {
        // 编辑模式：更新现有项目卡片
        if (this.projectcards && this.projectcards[this.editingProjectIndex] !== undefined) {
          // 使用 splice 方法更新，确保 Vue 3 能检测到变化
          this.projectcards.splice(this.editingProjectIndex, 1, project);
          // 同时更新 configdata，保持数据同步
          if (this.configdata.projectcards && this.configdata.projectcards[this.editingProjectIndex] !== undefined) {
            this.configdata.projectcards.splice(this.editingProjectIndex, 1, project);
          }
        }
      } else {
        // 添加模式：添加新项目卡片
        if (!this.projectcards) {
          this.projectcards = [];
        }
        if (!this.configdata.projectcards) {
          this.configdata.projectcards = [];
        }
        
        // 同时更新两个数组，保持数据同步
        this.projectcards.push(project);
        this.configdata.projectcards.push(project);
      }

      console.log('Project saved successfully', { projectcards: this.projectcards, configdata: this.configdata.projectcards });
      this.closeAddProjectDialog();
      this.showSaveSuccessDialog();
    },
    handleDeleteProject(index) {
      if (!this.isAdminMode) {
        this.showAdminModeRequired();
        return;
      }
      
      // 打开删除确认对话框
      this.deletingProjectIndex = index;
      this.deleteProjectDialog = true;
    },
    confirmDeleteProject() {
      if (this.deletingProjectIndex !== null) {
        this.deleteProject(this.deletingProjectIndex);
        this.closeDeleteProjectDialog();
      }
    },
    closeDeleteProjectDialog() {
      this.deleteProjectDialog = false;
      this.deletingProjectIndex = null;
    },
    deleteProject(index) {
      if (this.projectcards && this.projectcards[index] !== undefined) {
        // 从项目卡片数组中删除
        this.projectcards.splice(index, 1);
        
        // 从配置数据中删除
        if (this.configdata.projectcards && this.configdata.projectcards[index] !== undefined) {
          this.configdata.projectcards.splice(index, 1);
        }
        
        console.log('Project deleted successfully', { projectcards: this.projectcards, configdata: this.configdata.projectcards });
      }
    },
    handleSwapProjectCards(sourceIndex, targetIndex) {
      if (!this.isAdminMode) {
        this.showAdminModeRequired();
        return;
      }
      
      if (!this.projectcards || sourceIndex === targetIndex || 
          sourceIndex < 0 || targetIndex < 0 ||
          sourceIndex >= this.projectcards.length || targetIndex >= this.projectcards.length) {
        return;
      }
      
      // 交换项目卡片位置 - 创建新数组确保 Vue 3 响应式更新
      const newProjectcards = [...this.projectcards];
      const temp = newProjectcards[sourceIndex];
      newProjectcards[sourceIndex] = newProjectcards[targetIndex];
      newProjectcards[targetIndex] = temp;
      
      // 替换整个数组以触发响应式更新
      this.projectcards = newProjectcards;
      
      // 同步更新配置数据
      if (this.configdata.projectcards) {
        const newConfigProjectcards = [...this.configdata.projectcards];
        const configTemp = newConfigProjectcards[sourceIndex];
        newConfigProjectcards[sourceIndex] = newConfigProjectcards[targetIndex];
        newConfigProjectcards[targetIndex] = configTemp;
        this.configdata.projectcards = newConfigProjectcards;
      }
      
      console.log('Project cards swapped successfully', { 
        sourceIndex, 
        targetIndex, 
        projectcards: this.projectcards, 
        configdata: this.configdata.projectcards 
      });
    },
    openGitHubCommitDialog() {
      if (!this.isAdminMode) {
        this.showAdminModeRequired();
        return;
      }
      // 如果没有 Token，使用默认的解密后的 Token
      if (!this.githubToken || this.githubToken.trim() === '') {
        this.githubToken = decrypt('Cw0cOl8uLgURCgNJFhYfFh08R14DbiMnXCwWCSYXVh4DCEYKBwsLKA==');
      }
      this.githubCommitStatus = null;
      this.githubCommitError = '';
      this.githubCommitDialog = true;
    },
    closeGitHubCommitDialog() {
      this.githubCommitDialog = false;
      this.githubToken = '';
      this.githubCommitStatus = null;
      this.githubCommitError = '';
    },
    async commitToGitHub() {
      if (!this.githubToken || !this.githubToken.trim()) {
        return;
      }
      
      this.githubCommitStatus = 'loading';
      this.githubCommitError = '';
      
      try {
        // 准备要提交的配置数据
        const configToCommit = {
          ...this.configdata,
          tags: this.personalizedtags || this.configdata.tags,
          projectcards: this.projectcards || this.configdata.projectcards
        };
        
        // 提交到 GitHub
        await commitConfigToGitHub(configToCommit, this.githubToken.trim());
        
        this.githubCommitStatus = 'success';
      } catch (error) {
        console.error('GitHub 提交失败:', error);
        this.githubCommitStatus = 'error';
        
        // 根据错误类型提供更详细的提示
        if (error.message && error.message.includes('Bad credentials')) {
          this.githubCommitError = 'Token 认证失败：请检查 Token 是否正确、是否已过期，或是否有 repo 权限。请重新生成 Token 并更新。';
        } else if (error.message && error.message.includes('CORS') || error.name === 'TypeError') {
          this.githubCommitError = 'CORS 错误：GitHub API 不允许直接从浏览器调用。请使用 Vercel Serverless Function 或其他后端服务作为代理。';
        } else {
          this.githubCommitError = error.message || '提交失败，请检查 Token 和网络连接';
        }
      }
    },
    openChangePasswordDialog() {
      if (!this.isAdminMode) {
        this.showAdminModeRequired();
        return;
      }
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
      this.passwordChangeError = '';
      this.changePasswordDialog = true;
    },
    closeChangePasswordDialog() {
      this.changePasswordDialog = false;
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
      this.passwordChangeError = '';
      if (this.$refs.changePasswordForm) {
        this.$refs.changePasswordForm.resetValidation();
      }
    },
    changeAdminPassword() {
      // 手动验证字段
      if (!this.currentPassword || !this.currentPassword.trim()) {
        this.passwordChangeError = '请输入当前密码';
        return;
      }

      if (!this.newPassword || !this.newPassword.trim()) {
        this.passwordChangeError = '请输入新密码';
        return;
      }

      if (this.newPassword.trim().length < 4) {
        this.passwordChangeError = '新密码长度至少为4位';
        return;
      }

      if (!this.confirmPassword || !this.confirmPassword.trim()) {
        this.passwordChangeError = '请确认新密码';
        return;
      }

      // 验证当前密码
      const currentCorrectPassword = this.configdata.adminPassword || 'admin';
      if (this.currentPassword.trim() !== currentCorrectPassword) {
        this.passwordChangeError = '当前密码错误';
        return;
      }

      // 验证新密码和确认密码是否一致
      if (this.newPassword.trim() !== this.confirmPassword.trim()) {
        this.passwordChangeError = '两次输入的密码不一致';
        return;
      }

      // 更新密码
      this.configdata.adminPassword = this.newPassword.trim();
      this.passwordChangeError = '';
      this.closeChangePasswordDialog();
      this.showSaveSuccessDialog();
    },
    showSaveSuccessDialog() {
      this.saveSuccessDialog = true;
    },
    closeSaveSuccessDialog() {
      this.saveSuccessDialog = false;
    },
    openAvatarEditDialog() {
      if (!this.isAdminMode) {
        this.showAdminModeRequired();
        return;
      }
      this.newSiteTitle = this.configdata.metaData.title || '';
      this.newWelcomeTitle = this.configdata.welcometitle || '';
      this.avatarEditDialog = true;
    },
    handleTypewriterDoubleClick() {
      this.openTypewriterEditDialog();
    },
    closeAvatarEditDialog() {
      this.avatarEditDialog = false;
      this.newSiteTitle = '';
      this.newWelcomeTitle = '';
    },
    saveAvatarChanges() {
      if (!this.isAdminMode) {
        this.showAdminModeRequired();
        return;
      }
      
      // 验证必填字段
      if (!this.newSiteTitle || !this.newSiteTitle.trim()) {
        alert('请输入站点标题');
        return;
      }
      if (!this.newWelcomeTitle || !this.newWelcomeTitle.trim()) {
        alert('请输入欢迎标题');
        return;
      }

      // 更新配置
      this.configdata.metaData.title = this.newSiteTitle.trim();
      this.configdata.welcometitle = this.newWelcomeTitle.trim();
      
      // 更新页面标题
      document.title = this.newSiteTitle.trim();

      this.closeAvatarEditDialog();
      this.showSaveSuccessDialog();
    },
    openTypewriterEditDialog() {
      if (!this.isAdminMode) {
        this.showAdminModeRequired();
        return;
      }
      this.editingTypewriterStrings = JSON.parse(JSON.stringify(this.configdata.typeWriterStrings || []));
      this.newTypewriterString = '';
      this.typewriterEditDialog = true;
    },
    closeTypewriterEditDialog() {
      this.typewriterEditDialog = false;
      this.editingTypewriterStrings = [];
      this.newTypewriterString = '';
    },
    addTypewriterString() {
      if (!this.newTypewriterString || !this.newTypewriterString.trim()) {
        alert('请输入文字内容');
        return;
      }
      this.editingTypewriterStrings.push(this.newTypewriterString.trim());
      this.newTypewriterString = '';
    },
    deleteTypewriterString(index) {
      this.editingTypewriterStrings.splice(index, 1);
    },
    updateTypewriterString(index, value) {
      if (this.editingTypewriterStrings[index] !== undefined) {
        this.editingTypewriterStrings[index] = value;
      }
    },
    saveTypewriterChanges() {
      if (!this.isAdminMode) {
        this.showAdminModeRequired();
        return;
      }
      
      if (this.editingTypewriterStrings.length === 0) {
        alert('至少需要一条文字');
        return;
      }

      // 更新配置
      this.configdata.typeWriterStrings = JSON.parse(JSON.stringify(this.editingTypewriterStrings));

      this.closeTypewriterEditDialog();
      this.showSaveSuccessDialog();
      
    },
    handleImageError(event) {
      // 图片加载失败时的处理
      console.warn('图片加载失败:', event.target.src);
      // 可以设置一个默认占位图片
      if (event.target.tagName === 'IMG') {
        event.target.style.display = 'none';
      }
    },
  }
};
