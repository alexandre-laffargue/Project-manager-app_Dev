import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import KanbanView from '../views/KanbanView.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', redirect: '/kanban' },
      { path: 'kanban', component: KanbanView },
      { path: 'backlog', component: () => import('../views/BacklogView.vue') },
      { path: 'chronologie', component: () => import('../views/ChronologieView.vue') },
    ],
  },
  { path: '/login', component: LoginView },
  { path: '/register', component: RegisterView },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
