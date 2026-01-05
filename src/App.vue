<template>
  <v-app class="vapp-fullscreen-background" style="overflow: hidden;" :class="{ 'radius-before': !xs }"
  :style="xs?{height: '100%',width: '100%',top: '0',left:'0'}:(sm?{height: '98%',width: '98%',top: '1%',left:' 1%'}:{height: '96.6%',width: '99%',top: '1.7%',left:' 0.5%'})">
    <transition name="fade">
      <div class="loading" v-show="isloading">
        <loader></loader>
      </div>
    </transition>

    <video autoplay loop muted class="video-bg" id="bg-video" ref="VdPlayer"
    :style="xs?{height: '100%',width: '100%',top: '0',left:'0'}:(sm?{height: '98%',width: '98%',top: '1%',left:' 1%','border-radius': '16px'}:{height: '96.6%',width: '99%',top: '1.7%',left:' 0.5%','border-radius': '16px',})">
        <source :src=videosrc type="video/mp4">
    </video>

    <div class="floating-switch-container">
      <v-switch
        v-model="isClearScreen"
        inset
        :style="xs?{'transform':'scale(0.6) translateX(15%)'}:{}"
        class="floating-switch"
        @mouseover="expandSwitch"
        @mouseleave="collapseSwitch"
      ></v-switch>
    </div>
    
    <div v-show="!isloading && !isClearScreen" :style="xs||sm?{'overflow-y': 'auto','overflow-x': 'hidden'}:{}">
        <v-row>
            <v-col cols="12" md="4" lg="3" class="leleo-left" align="center">
              <div :style="xs||sm?{'font-size':'2.3rem'}:{'display':'none'}" class="leleo-left-welcome" @dblclick="openAdminPasswordDialog">{{ configdata.welcometitle }}</div>  
              <v-avatar class="leleo-left-avatar" :size="xs||sm?120:140" :style="xs||sm?{'margin-top': '0'}:{'margin-top': '2rem'}" @mouseenter="musicplayershow(1)" @mouseleave="musicplayershow(0)" @dblclick="isAdminMode ? openAvatarEditDialog() : showAdminModeRequired()">
                  <v-img :class="{'leleo-spin':isPlaying}"
                  :key="configdata.avatar"
                  alt="Leleo"
                  :src="configdata.avatar"
                  @error="handleImageError"
                  >
                    <template v-slot:placeholder>
                      <v-row
                        class="fill-height ma-0"
                        align="center"
                        justify="center"
                      >
                        <v-progress-circular
                          indeterminate
                          color="grey-lighten-5"
                        ></v-progress-circular>
                      </v-row>
                    </template>
                  </v-img>
                  <!-- 由于当ismusicplayer显示后，fadein无效果，所以需要设置一个过渡动画 -->
                  <transition name="fade">
                  <v-card v-show="ismusicplayer" class="musicplayer" :class="{'fade-in':ismusicplayer}" variant="tonal">
                      <div v-if="audioLoading" class="loading-spinner">
                          <v-progress-circular indeterminate></v-progress-circular>
                      </div>
                      <span ref="audiotitle" class="musicplayer-text"
                        style="top: 1.6rem;font-weight: bolder;"
                      >{{ musicinfo?.[0]?.title }}</span>
                      <span ref="audioauthor" class="musicplayer-text"
                        style="bottom: 1.4rem;"
                      >{{ musicinfo?.[0]?.author }}</span>
                      <audio v-show="false" ref="audioPlayer" :src="musicinfo?.[0]?.url"
                      @waiting="onWaiting"
                      @canplay="onCanPlay">
                      </audio>
                      <v-btn :size="xs||sm?22:30" color="#999999" icon @click="previousTrack()">
                      <v-icon>mdi-skip-previous</v-icon>
                      </v-btn>
                      <v-btn :size="xs||sm?35:48" color="#999999" icon @click="togglePlay()">
                      <v-icon>{{ isPlaying? 'mdi-pause' : 'mdi-play' }}</v-icon>
                      </v-btn>
                      <v-btn :size="xs||sm?22:30" color="#999999" icon @click="nextTrack()">
                      <v-icon>mdi-skip-next</v-icon>
                      </v-btn>
                  </v-card>
                  </transition>
                </v-avatar>

                <!-- 音量控制区域 -->
                <div class="volume-control-container">
                  <v-btn 
                    :size="xs||sm?24:28" 
                    color="#999999" 
                    icon 
                    @click="toggleVolumeSlider"
                    class="volume-btn"
                  >
                    <v-icon>{{ volume === 0 ? 'mdi-volume-off' : volume < 50 ? 'mdi-volume-low' : 'mdi-volume-high' }}</v-icon>
                  </v-btn>
                  <transition name="slide-fade">
                    <div v-show="showVolumeSlider" class="volume-slider-wrapper">
                      <v-slider
                        v-model="volume"
                        :min="0"
                        :max="100"
                        :step="1"
                        color="#999999"
                        track-color="rgba(153, 153, 153, 0.3)"
                        :thumb-size="xs||sm?8:10"
                        density="compact"
                        hide-details
                        :style="xs||sm?{'width': '80px'}:{'width': '100px'}"
                        @update:modelValue="updateVolume"
                      ></v-slider>
                    </div>
                  </transition>
                </div>

                <v-card class="ma-5 pa-2 leleo-left-card" variant="tonal" :max-width="xs?270:300" style="text-align: center;" @dblclick="isAdminMode ? openTagsDialog() : showAdminModeRequired()">
                    <template v-slot:title>
                    <span>Tags</span>
                    </template>
                    <v-chip v-for="item in personalizedtags" density="compact" link class="ma-1" size="small">
                    {{item}}
                    </v-chip>
                </v-card>

                <div class="leleo-left-chart">
                    <polarchart :style="xs||sm?{'height':'210px'}:{'height':'270px'}"/>
                </div>

                <v-container class="leleo-left-socialIconsContainer">
                    <v-row align="center" justify="center">
                    <v-col class="pa-1" cols="auto" v-for="item in socialPlatformIcons">
                        <v-btn :size="xs?25:33" variant="tonal" color="var(--leleo-vcard-color)"
                        class="ma-1 leleo-social-bticon"
                        icon
                        :href="item.link" target="_blank"
                        >
                    <v-icon :icon=item.icon :size="xs?20:25" class="social-bticon-icon"></v-icon></v-btn>
                    </v-col>
                    </v-row>

                    <v-row align="center" justify="center" class="setting">
                    <v-col class="ma-1" cols="auto">
                        <v-speed-dial
                            :location="xs||sm ?'top center':'right center'"
                            transition="slide-y-transition"
                        >
                        <template v-slot:activator="{ props: activatorProps }">
                            <v-fab style="width: 2.5rem;height: 2.5rem;" color="var(--leleo-vcard-color)"
                            variant="tonal"
                            v-bind="activatorProps"
                            icon="mdi-cog"
                            ></v-fab>
                        </template>
                        <v-btn variant="tonal" class="setbtn" key="1" icon="mdi-key-chain" @click="dialog1 = true" size="31" color="var(--leleo-vcard-color)"></v-btn>
                        <v-btn variant="tonal" class="setbtn" key="2" icon="mdi-information" @click="dialog2 = true" size="31" color="var(--leleo-vcard-color)"></v-btn>
                        <v-btn v-if="isAdminMode" variant="tonal" class="setbtn" key="5" icon="mdi-lock-reset" @click="openChangePasswordDialog" size="31" color="var(--leleo-vcard-color)"></v-btn>
                        <v-btn v-if="isAdminMode" variant="tonal" class="setbtn" key="4" icon="mdi-github" @click="openGitHubCommitDialog" size="31" color="var(--leleo-vcard-color)"></v-btn>
                        <v-btn variant="tonal" class="setbtn" key="3" icon="$error" size="31" color="var(--leleo-vcard-color)"></v-btn>
                        </v-speed-dial>
                    </v-col>
                    <v-col class="ma-1" cols="auto">
                        <v-btn
                            variant="tonal"
                            color="var(--leleo-vcard-color)"
                            density="compact"
                            rounded="pill"
                            :href="'https://icp.gov.moe/?keyword=20260017'"
                            target="_blank"
                            class="icp-btn"
                            :prepend-icon="'mdi-certificate'"
                            style="text-transform: none; font-size: 0.75rem;"
                        >
                            萌ICP备20260017号
                        </v-btn>
                    </v-col>
                    </v-row>
                </v-container>
            </v-col>

            <v-col cols="12" md="8" lg="9" style="height: 100vh;" :style="xs||sm ?{}:{'overflow': 'auto'}">
                <homeright :configdata=configdata :formattedTime=formattedTime 
                :formattedDate=formattedDate :projectcards=projectcards :isAdminMode=isAdminMode
                @open-add-project-dialog="openAddProjectDialog"
                @open-edit-project-dialog="openEditProjectDialog"
                @open-admin-password-dialog="openAdminPasswordDialog"
                @show-admin-mode-required="showAdminModeRequired"
                @delete-project="handleDeleteProject"
                @open-typewriter-edit-dialog="openTypewriterEditDialog"
                @swap-project-cards="handleSwapProjectCards"></homeright>
            </v-col>
        </v-row>
    </div>

    <v-dialog
        v-model="dialog1"
        width="1000"
        heihght="700"
      >
      <v-card elevation="3" style="backdrop-filter: blur(10px);">
        <v-tabs
          v-model="tab"
          :items="tabs"
          align-tabs="center"
          height="60"
          slider-color=var(--leleo-vcard-color)
        >
          <template v-slot:tab="{ item }">
            <v-tab
              :prepend-icon="item.icon"
              :text="item.text"
              :value="item.value"
              class="text-none"
            ></v-tab>
          </template>
          
          <template v-slot:item="{ item }">
            <v-tabs-window-item :value="item.value" class="pa-4">
              <div v-if="item.value=='tab-3' && musicinfoLoading" class="loading-spinner" align="center">
                  <v-progress-circular indeterminate></v-progress-circular>
              </div>
              <!-- 通过组件绑定不同tab项的组件 -->
              <component v-if="item.value!='tab-3' || (item.value=='tab-3' && !musicinfoLoading)" :is=item.component @cancel="handleCancel" 
              :musicinfo="item.value=='tab-3'?musicinfo:[]"
              :currentIndex="item.value=='tab-3'?playlistIndex:null"
              :isPlaying="item.value=='tab-3'?isPlaying:null"
              :audioPlayer="item.value=='tab-3'?audioPlayer:null"
              :fromLyrics="item.value=='tab-3'?lyrics:null"
              :audioLoading="item.value=='tab-3'?audioLoading:null"
              @update:current-index="updateCurrentIndex"
              @update:is-playing="updateIsPlaying"
              @update:current-lyrics="updateLyrics"
              ></component>
            </v-tabs-window-item>
          </template>
        </v-tabs>
      </v-card>
      </v-dialog>

      <v-dialog
        v-model="dialog2"
        width="700"
        heihght="500"
      >
      <v-card class="ma-3 pa-2" hover
          variant="tonal"
          rounded="lg"
          style="text-align: center;backdrop-filter: blur(10px);"
        >
          <template v-slot:title >
            <span class="leleo-card-title">关于</span>
          </template>
          <div style="display: flex;flex-direction: column;align-items: center;">
            <v-card class="ma-3 pa-2" hover
              variant="tonal"
              max-width="400"
              rounded="lg"
              style="text-align: center;"
              >
              <template v-slot:subtitle>
                <span class="leleo-card-subtitle">本页基于以下技术及服务搭建</span>
              </template>
              <div>
                <v-tooltip  v-for="item in stackicons" v-model="item.model" location="top">
                  <template v-slot:activator="{ props }">
                    <v-btn icon v-bind="props" :color=item.color rounded="lg" class="ma-1 stack-btn" size="35">
                      <v-icon size="25" color="white">{{item.icon}}</v-icon>
                    </v-btn>
                  </template>
                  <span>{{item.tip}}</span>
                </v-tooltip>
                <!-- 自定义 -->
                <v-tooltip location="top">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" rounded="lg" class="ma-1 stack-btn" size="35">
                      <v-avatar image="/img/stackicon/vite.svg" rounded="0" size="23">
                        <v-icon>mdi-vuejs</v-icon>
                      </v-avatar>
                    </v-btn>
                  </template>
                  <span>vite</span>
                </v-tooltip>
                <v-tooltip location="top">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" rounded="lg" class="ma-1 stack-btn" size="35" color="#254B7C">
                      <span style="font-size: 8px;font-weight: bolder;">{less}</span>
                    </v-btn>
                  </template>
                  <span>less</span>
                </v-tooltip>
                <v-tooltip location="top">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" rounded="lg" class="ma-1 stack-btn" size="35">
                      <v-avatar image="/img/stackicon/mdi.svg" rounded="0" size="35">
                        <v-icon>mdi-material-design</v-icon>
                      </v-avatar>
                    </v-btn>
                  </template>
                  <span>mdi</span>
                </v-tooltip>
                <v-tooltip location="top">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" rounded="lg" class="ma-1 stack-btn" size="35">
                      <v-avatar image="/img/stackicon/chartjs.png" rounded="0" size="23">
                        <v-icon>mdi-chart-line</v-icon>
                      </v-avatar>
                    </v-btn>
                  </template>
                  <span>chartjs</span>
                </v-tooltip>
                <v-tooltip location="top">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" rounded="lg" class="ma-1 stack-btn" size="35" color="#0F1225">
                      <v-avatar image="/img/stackicon/meting.png" rounded="0" size="23">
                        <v-icon>mdi-music</v-icon>
                      </v-avatar>
                    </v-btn>
                  </template>
                  <span>meting</span>
                </v-tooltip>
                <v-tooltip location="top">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" rounded="lg" class="ma-1 stack-btn" size="35" color="#070707">
                      <v-avatar image="/img/stackicon/uiverse.png" rounded="0" size="23">
                        <v-icon>mdi-palette</v-icon>
                      </v-avatar>
                    </v-btn>
                  </template>
                  <span>uiverse</span>
                </v-tooltip>
              </div>

              <!-- 在这里添加备案信息链接 -->
              <v-row align="center" justify="center" class="mt-4">
                <v-col cols="auto">
                  <a href="https://icp.gov.moe/?keyword=20260017" target="_blank" style="color: var(--leleo-vcard-color); text-decoration: none; font-size: 0.9rem;">
                    萌ICP备20260017号
                  </a>
                </v-col>
              </v-row>
            </v-card>

            <p class="ma-6">
                <span v-for="item in configdata.statement">
                  {{ item }}<br>
                </span>
            </p>
          </div>
        </v-card>
    </v-dialog>

    <!-- 标签编辑对话框 -->
    <v-dialog
      v-model="tagsDialog"
      max-width="600"
      persistent
      class="tags-edit-dialog"
    >
      <v-card class="tags-edit-card" variant="tonal">
        <v-card-title class="tags-edit-title">
          <v-icon class="mr-2">mdi-tag-multiple</v-icon>
          <span>编辑标签</span>
          <v-spacer></v-spacer>
          <v-btn
            icon
            size="small"
            variant="text"
            @click="closeTagsDialog"
            class="close-btn"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider class="tags-edit-divider"></v-divider>

        <v-card-text class="tags-edit-content">
          <!-- 标签列表 -->
          <div class="tags-list-container">
            <div
              v-for="(tag, index) in editingTags"
              :key="index"
              class="tag-item"
            >
              <v-text-field
                v-model="editingTags[index]"
                density="compact"
                variant="outlined"
                hide-details
                class="tag-input"
                @blur="updateTag(index)"
              ></v-text-field>
              <v-btn
                icon
                size="small"
                color="error"
                variant="text"
                @click="deleteTag(index)"
                class="tag-delete-btn"
              >
                <v-icon size="small">mdi-delete</v-icon>
              </v-btn>
            </div>
          </div>

          <!-- 添加新标签 -->
          <div class="add-tag-container">
            <v-text-field
              v-model="newTag"
              label="添加新标签"
              density="compact"
              variant="outlined"
              hide-details
              class="new-tag-input"
              @keyup.enter="addTag"
              clearable
            ></v-text-field>
            <v-btn
              color="primary"
              variant="tonal"
              @click="addTag"
              :disabled="!newTag || newTag.trim() === ''"
              class="add-tag-btn"
            >
              <v-icon start>mdi-plus</v-icon>
              添加
            </v-btn>
          </div>
        </v-card-text>

        <v-divider class="tags-edit-divider"></v-divider>

        <v-card-actions class="tags-edit-actions">
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="closeTagsDialog"
            class="cancel-btn"
          >
            取消
          </v-btn>
          <v-btn
            color="primary"
            variant="tonal"
            @click.prevent="saveTags"
            type="button"
            class="save-btn"
          >
            <v-icon start>mdi-content-save</v-icon>
            保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 添加/编辑项目卡片对话框 -->
    <v-dialog
      v-model="addProjectDialog"
      max-width="700"
      persistent
      class="add-project-dialog"
    >
      <v-card class="add-project-card" variant="tonal">
        <v-card-title class="add-project-title">
          <v-icon class="mr-2">{{ editingProjectIndex !== null ? 'mdi-pencil' : 'mdi-plus-circle' }}</v-icon>
          <span>{{ editingProjectIndex !== null ? '编辑项目卡片' : '添加项目卡片' }}</span>
          <v-spacer></v-spacer>
          <v-btn
            icon
            size="small"
            variant="text"
            @click="closeAddProjectDialog"
            class="close-btn"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider class="add-project-divider"></v-divider>

        <v-card-text class="add-project-content">
          <v-form ref="addProjectForm" @submit.prevent="saveProject">
            <v-text-field
              v-model="newProject.go"
              label="按钮文本（如：🚀 前往）"
              density="compact"
              variant="outlined"
              class="mb-3"
              :rules="[v => !!v || '请输入按钮文本']"
            ></v-text-field>

            <v-text-field
              v-model="newProject.img"
              label="图片URL"
              density="compact"
              variant="outlined"
              class="mb-3"
              :rules="[v => !!v || '请输入图片URL']"
            ></v-text-field>

            <v-text-field
              v-model="newProject.title"
              label="标题"
              density="compact"
              variant="outlined"
              class="mb-3"
              :rules="[v => !!v || '请输入标题']"
            ></v-text-field>

            <v-text-field
              v-model="newProject.subtitle"
              label="副标题"
              density="compact"
              variant="outlined"
              class="mb-3"
              :rules="[v => !!v || '请输入副标题']"
            ></v-text-field>

            <v-textarea
              v-model="newProject.text"
              label="详细描述"
              density="compact"
              variant="outlined"
              rows="4"
              class="mb-3"
              :rules="[v => !!v || '请输入详细描述']"
            ></v-textarea>

            <v-text-field
              v-model="newProject.url"
              label="链接地址"
              density="compact"
              variant="outlined"
              class="mb-3"
              :rules="[v => !!v || '请输入链接地址']"
              @keyup.enter="saveProject"
            ></v-text-field>

            <v-switch
              v-model="newProject.show"
              label="初始展开状态"
              color="primary"
              density="compact"
              class="mb-3"
              hint="控制卡片初始时是否展开显示详细描述"
              persistent-hint
            ></v-switch>
          </v-form>
        </v-card-text>

        <v-divider class="add-project-divider"></v-divider>

        <v-card-actions class="add-project-actions">
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="closeAddProjectDialog"
            class="cancel-btn"
          >
            取消
          </v-btn>
          <v-btn
            color="primary"
            variant="tonal"
            @click.prevent="saveProject"
            type="button"
            class="save-btn"
          >
            <v-icon start>mdi-content-save</v-icon>
            {{ editingProjectIndex !== null ? '保存修改' : '保存' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 管理员密码输入对话框 -->
    <v-dialog
      v-model="adminPasswordDialog"
      max-width="400"
      persistent
      class="admin-password-dialog"
    >
      <v-card class="admin-password-card" variant="tonal">
        <v-card-title class="admin-password-title">
          <v-icon class="mr-2">mdi-lock</v-icon>
          <span>管理员模式</span>
          <v-spacer></v-spacer>
          <v-btn
            icon
            size="small"
            variant="text"
            @click="closeAdminPasswordDialog"
            class="close-btn"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider class="admin-password-divider"></v-divider>

        <v-card-text class="admin-password-content">
          <v-text-field
            v-model="adminPasswordInput"
            label="请输入管理员密码"
            type="password"
            density="compact"
            variant="outlined"
            class="mb-3"
            :error="passwordError"
            :error-messages="passwordError ? '密码错误，请重试' : ''"
            @keyup.enter="verifyAdminPassword"
            autofocus
          ></v-text-field>
          <div v-if="isAdminMode" class="admin-mode-indicator">
            <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
            <span style="color: var(--leleo-vcard-color);">已进入管理员模式</span>
          </div>
        </v-card-text>

        <v-divider class="admin-password-divider"></v-divider>

        <v-card-actions class="admin-password-actions">
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="closeAdminPasswordDialog"
            class="cancel-btn"
          >
            取消
          </v-btn>
          <v-btn
            color="primary"
            variant="tonal"
            @click="verifyAdminPassword"
            class="verify-btn"
            :disabled="!adminPasswordInput"
          >
            <v-icon start>mdi-login</v-icon>
            验证
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 退出管理员模式确认对话框 -->
    <v-dialog
      v-model="showExitAdminDialog"
      max-width="400"
      persistent
      class="exit-admin-dialog"
    >
      <v-card class="exit-admin-card" variant="tonal">
        <v-card-title class="exit-admin-title">
          <v-icon class="mr-2" color="warning">mdi-logout</v-icon>
          <span>退出管理员模式</span>
          <v-spacer></v-spacer>
          <v-btn
            icon
            size="small"
            variant="text"
            @click="closeExitAdminDialog"
            class="close-btn"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider class="exit-admin-divider"></v-divider>

        <v-card-text class="exit-admin-content">
          <div class="exit-warning">
            <p>确定要退出管理员模式吗？</p>
            <p class="warning-text">退出后将无法进行编辑操作。</p>
          </div>
        </v-card-text>

        <v-divider class="exit-admin-divider"></v-divider>

        <v-card-actions class="exit-admin-actions">
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="closeExitAdminDialog"
            class="cancel-btn"
          >
            取消
          </v-btn>
          <v-btn
            color="warning"
            variant="tonal"
            @click.prevent="exitAdminMode"
            class="exit-confirm-btn"
          >
            <v-icon start>mdi-logout</v-icon>
            确认退出
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除项目卡片确认对话框 -->
    <v-dialog
      v-model="deleteProjectDialog"
      max-width="400"
      persistent
      class="delete-project-dialog"
    >
      <v-card class="delete-project-card" variant="tonal">
        <v-card-title class="delete-project-title">
          <v-icon class="mr-2" color="error">mdi-alert-circle</v-icon>
          <span>确认删除</span>
          <v-spacer></v-spacer>
          <v-btn
            icon
            size="small"
            variant="text"
            @click="closeDeleteProjectDialog"
            class="close-btn"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider class="delete-project-divider"></v-divider>

        <v-card-text class="delete-project-content">
          <div class="delete-warning">
            <p>确定要删除这个项目卡片吗？</p>
            <p v-if="deletingProjectIndex !== null && projectcards && projectcards[deletingProjectIndex]" class="project-title">
              {{ projectcards[deletingProjectIndex].title }}
            </p>
            <p class="warning-text">此操作无法撤销！</p>
          </div>
        </v-card-text>

        <v-divider class="delete-project-divider"></v-divider>

        <v-card-actions class="delete-project-actions">
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="closeDeleteProjectDialog"
            class="cancel-btn"
          >
            取消
          </v-btn>
          <v-btn
            color="error"
            variant="tonal"
            @click.prevent="confirmDeleteProject"
            class="delete-confirm-btn"
          >
            <v-icon start>mdi-delete</v-icon>
            确认删除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- GitHub 提交对话框 -->
    <v-dialog
      v-model="githubCommitDialog"
      max-width="600"
      persistent
      class="github-commit-dialog"
    >
      <v-card class="github-commit-card" variant="tonal">
        <v-card-title class="github-commit-title">
          <v-icon class="mr-2">mdi-github</v-icon>
          <span>提交到 GitHub</span>
          <v-spacer></v-spacer>
          <v-btn
            icon
            size="small"
            variant="text"
            @click="closeGitHubCommitDialog"
            class="close-btn"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider class="github-commit-divider"></v-divider>

        <v-card-text class="github-commit-content">
          <div v-if="githubCommitStatus === 'loading'" class="github-commit-loading">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <p class="mt-4">正在提交到 GitHub...</p>
          </div>
          
          <div v-else-if="githubCommitStatus === 'success'" class="github-commit-success">
            <v-icon color="success" size="48" class="mb-3">mdi-check-circle</v-icon>
            <p class="success-text">提交成功！</p>
            <p class="success-detail">配置已成功提交到 GitHub 仓库</p>
          </div>
          
          <div v-else-if="githubCommitStatus === 'error'" class="github-commit-error">
            <v-icon color="error" size="48" class="mb-3">mdi-alert-circle</v-icon>
            <p class="error-text">提交失败</p>
            <p class="error-detail">{{ githubCommitError }}</p>
          </div>
          
          <v-form v-else ref="githubCommitForm" @submit.prevent="commitToGitHub">
            <v-text-field
              v-model="githubToken"
              label="GitHub Personal Access Token"
              :type="showGitHubToken ? 'text' : 'password'"
              density="compact"
              variant="outlined"
              class="mb-3"
              :rules="[v => !!v || '请输入 GitHub Token']"
              hint="需要 repo 权限的 Personal Access Token"
              persistent-hint
              :append-inner-icon="showGitHubToken ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showGitHubToken = !showGitHubToken"
              @keyup.enter="commitToGitHub"
            ></v-text-field>
            
            <v-alert type="info" density="compact" class="mb-3">
              <div class="text-caption">
                <p><strong>如何获取 Token：</strong></p>
                <ol style="margin: 8px 0; padding-left: 20px;">
                  <li>访问 <a href="https://github.com/settings/tokens" target="_blank">GitHub Settings → Developer settings → Personal access tokens</a></li>
                  <li>点击 "Generate new token (classic)"</li>
                  <li>勾选 <code>repo</code> 权限</li>
                  <li>生成并复制 Token</li>
                </ol>
              </div>
            </v-alert>
            
            <v-alert type="warning" density="compact" class="mb-3">
              <div class="text-caption">
                注意：Token 仅在此会话中使用，不会保存到服务器。由于 GitHub API 的 CORS 限制，可能需要配置代理或使用后端 API。
              </div>
            </v-alert>
          </v-form>
        </v-card-text>

        <v-divider v-if="githubCommitStatus !== 'loading'" class="github-commit-divider"></v-divider>

        <v-card-actions v-if="githubCommitStatus !== 'loading'" class="github-commit-actions">
          <v-spacer></v-spacer>
          <v-btn
            v-if="githubCommitStatus === 'success' || githubCommitStatus === 'error'"
            variant="text"
            @click="closeGitHubCommitDialog"
            class="close-btn"
          >
            关闭
          </v-btn>
          <template v-else>
            <v-btn
              variant="text"
              @click="closeGitHubCommitDialog"
              class="cancel-btn"
            >
              取消
            </v-btn>
            <v-btn
              color="primary"
              variant="tonal"
              @click.prevent="commitToGitHub"
              class="commit-btn"
              :disabled="!githubToken"
            >
              <v-icon start>mdi-github</v-icon>
              提交
            </v-btn>
          </template>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 修改管理员密码对话框 -->
    <v-dialog
      v-model="changePasswordDialog"
      max-width="500"
      persistent
      class="change-password-dialog"
    >
      <v-card class="change-password-card" variant="tonal">
        <v-card-title class="change-password-title">
          <v-icon class="mr-2">mdi-lock-reset</v-icon>
          <span>修改管理员密码</span>
          <v-spacer></v-spacer>
          <v-btn
            icon
            size="small"
            variant="text"
            @click="closeChangePasswordDialog"
            class="close-btn"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider class="change-password-divider"></v-divider>

        <v-card-text class="change-password-content">
          <div v-if="passwordChangeError" class="password-error-alert mb-3">
            <v-alert type="error" density="compact">
              {{ passwordChangeError }}
            </v-alert>
          </div>
          
          <v-form ref="changePasswordForm" @submit.prevent="changeAdminPassword">
            <v-text-field
              v-model="currentPassword"
              label="当前密码"
              type="password"
              density="compact"
              variant="outlined"
              class="mb-3"
              :rules="[v => !!v || '请输入当前密码']"
            ></v-text-field>

            <v-text-field
              v-model="newPassword"
              label="新密码"
              type="password"
              density="compact"
              variant="outlined"
              class="mb-3"
              :rules="[
                v => !!v || '请输入新密码',
                v => (v && v.length >= 4) || '密码长度至少为4位'
              ]"
            ></v-text-field>

            <v-text-field
              v-model="confirmPassword"
              label="确认新密码"
              type="password"
              density="compact"
              variant="outlined"
              class="mb-3"
              :rules="[
                v => !!v || '请确认新密码',
                v => v === newPassword || '两次输入的密码不一致'
              ]"
              @keyup.enter="changeAdminPassword"
            ></v-text-field>
          </v-form>
        </v-card-text>

        <v-divider class="change-password-divider"></v-divider>

        <v-card-actions class="change-password-actions">
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="closeChangePasswordDialog"
            class="cancel-btn"
          >
            取消
          </v-btn>
          <v-btn
            color="primary"
            variant="tonal"
            @click.prevent="changeAdminPassword"
            class="save-btn"
            :disabled="!currentPassword || !newPassword || !confirmPassword"
          >
            <v-icon start>mdi-content-save</v-icon>
            保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 修改站点标题和欢迎标题对话框 -->
    <v-dialog v-model="avatarEditDialog" max-width="600px" class="avatar-edit-dialog" persistent>
      <v-card class="avatar-edit-card">
        <v-card-title class="avatar-edit-title">
          <v-icon class="mr-2">mdi-text</v-icon>
          <span>修改站点标题和欢迎标题</span>
          <v-spacer></v-spacer>
          <v-btn
            icon
            size="small"
            variant="text"
            @click="closeAvatarEditDialog"
            class="close-btn"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider class="avatar-edit-divider"></v-divider>

        <v-card-text class="avatar-edit-content">
          <!-- 站点标题 -->
          <div class="mb-4">
            <v-text-field
              v-model="newSiteTitle"
              label="站点标题"
              density="compact"
              variant="outlined"
              hint="浏览器标签页显示的标题"
              persistent-hint
              @keyup.enter="saveAvatarChanges"
            ></v-text-field>
          </div>

          <!-- 欢迎标题 -->
          <div class="mb-4">
            <v-text-field
              v-model="newWelcomeTitle"
              label="欢迎标题"
              density="compact"
              variant="outlined"
              hint="页面显示的欢迎文字"
              persistent-hint
              @keyup.enter="saveAvatarChanges"
            ></v-text-field>
          </div>
        </v-card-text>

        <v-divider class="avatar-edit-divider"></v-divider>

        <v-card-actions class="avatar-edit-actions">
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="closeAvatarEditDialog"
            class="cancel-btn"
          >
            取消
          </v-btn>
          <v-btn
            type="button"
            color="primary"
            variant="tonal"
            @click.prevent="saveAvatarChanges"
            class="save-btn"
            :disabled="!newSiteTitle || !newWelcomeTitle"
          >
            <v-icon start>mdi-content-save</v-icon>
            保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 修改打字机文字对话框 -->
    <v-dialog v-model="typewriterEditDialog" max-width="700px" class="typewriter-edit-dialog" persistent>
      <v-card class="typewriter-edit-card">
        <v-card-title class="typewriter-edit-title">
          <v-icon class="mr-2">mdi-keyboard</v-icon>
          <span>修改打字机文字</span>
          <v-spacer></v-spacer>
          <v-btn
            icon
            size="small"
            variant="text"
            @click="closeTypewriterEditDialog"
            class="close-btn"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider class="typewriter-edit-divider"></v-divider>

        <v-card-text class="typewriter-edit-content">
          <!-- 现有文字列表 -->
          <div class="mb-4">
            <label class="mb-2 d-block">现有文字列表</label>
            <div v-for="(item, index) in editingTypewriterStrings" :key="index" class="typewriter-item mb-2">
              <v-text-field
                :model-value="item"
                @update:modelValue="updateTypewriterString(index, $event)"
                density="compact"
                variant="outlined"
                class="typewriter-input"
                hide-details
              >
                <template v-slot:append-inner>
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    @click="deleteTypewriterString(index)"
                    class="typewriter-delete-btn"
                  >
                    <v-icon size="small">mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-text-field>
            </div>
          </div>

          <!-- 添加新文字 -->
          <div class="add-typewriter-container">
            <v-text-field
              v-model="newTypewriterString"
              label="新文字内容"
              density="compact"
              variant="outlined"
              class="new-typewriter-input"
              @keyup.enter="addTypewriterString"
              hint="输入新文字后按Enter或点击添加按钮"
              persistent-hint
            ></v-text-field>
            <v-btn
              color="primary"
              variant="tonal"
              @click="addTypewriterString"
              class="add-typewriter-btn"
            >
              <v-icon start>mdi-plus</v-icon>
              添加
            </v-btn>
          </div>
        </v-card-text>

        <v-divider class="typewriter-edit-divider"></v-divider>

        <v-card-actions class="typewriter-edit-actions">
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="closeTypewriterEditDialog"
            class="cancel-btn"
          >
            取消
          </v-btn>
          <v-btn
            type="button"
            color="primary"
            variant="tonal"
            @click.prevent="saveTypewriterChanges"
            class="save-btn"
            :disabled="editingTypewriterStrings.length === 0"
          >
            <v-icon start>mdi-content-save</v-icon>
            保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script src="./app.js"></script>
<style scoped>
  @import url(/css/app.less);
  @import url(/css/mobile.less);
</style>
