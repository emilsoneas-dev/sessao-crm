import { useEffect, useState } from 'react';
import {
  BarChart3,
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Settings,
  ChevronLeft,
  ChevronDown,
  Menu,
  ClipboardCheck,
  DollarSign,
  FolderKanban,
  Camera,
  UserCog,
} from 'lucide-react';
import { LogoManager } from './LogoManager.jsx';
import { canAccessPage } from '../../config/permissions.js';
import './sidebar-account.css';

const menuItems = [
  {
    id: 'visao-geral',
    label: 'Visao Geral',
    icon: LayoutDashboard,
    children: [
      { id: 'estrategica', label: 'Estrategico', icon: BarChart3, pageId: 'visao-geral', viewId: 'estrategica' },
      { id: 'operacional', label: 'Operacional', icon: FolderKanban, pageId: 'visao-geral', viewId: 'operacional' },
    ],
  },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'clientes', label: 'Clientes', icon: Briefcase },
  { id: 'instagram', label: 'Instagram', icon: Camera },
  { id: 'conteudo', label: 'Conteudo', icon: FileText },
  { id: 'tarefas', label: 'Operacional', icon: ClipboardCheck },
  {
    id: 'financeiro',
    label: 'Direcao',
    icon: DollarSign,
    children: [
      { id: 'financeiro', label: 'Financeiro', icon: DollarSign, pageId: 'financeiro' },
      { id: 'recursos-humanos', label: 'Recursos Humanos', icon: UserCog, pageId: 'recursos-humanos' },
    ],
  },
  { id: 'documentos', label: 'Documentos', icon: FileText },
  { id: 'configuracoes', label: 'Configuracoes', icon: Settings },
];

export function Sidebar({
  collapsed,
  onToggleCollapse,
  activePage = 'leads',
  activeOverviewView = 'estrategica',
  userRole = 'funcionario',
  extraPermissions = [],
  onNavigate = () => {},
  onOverviewViewChange = () => {},
}) {
  const [openGroups, setOpenGroups] = useState(() => {
    return {
      'visao-geral': localStorage.getItem('crm_sidebar_visao_geral_open') === 'true',
      financeiro: localStorage.getItem('crm_sidebar_direcao_open') === 'true',
    };
  });

  const allowedMenuItems = menuItems.filter((item) => {
    return canAccessPage(userRole, item.id, extraPermissions);
  });

  useEffect(() => {
    localStorage.setItem('crm_sidebar_visao_geral_open', String(openGroups['visao-geral']));
    localStorage.setItem('crm_sidebar_direcao_open', String(openGroups.financeiro));
  }, [openGroups]);

  function toggleGroup(itemId) {
    setOpenGroups((current) => ({
      ...current,
      [itemId]: !current[itemId],
    }));
  }

  return (
    <aside className={`sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="sidebar__top">
        <LogoManager collapsed={collapsed} />

        <button
          className="sidebar__collapse"
          type="button"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <Menu size={18} /> : <ChevronLeft size={17} />}
        </button>
      </div>

      <nav className="sidebar__nav">
        {allowedMenuItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = Boolean(item.children?.length);
          const isActive = activePage === item.id || item.children?.some((child) => child.pageId === activePage);
          const isOpen = Boolean(openGroups[item.id]);

          return (
            <div className={`sidebar__group ${isOpen ? 'is-open' : ''}`} key={item.id}>
              <button
                className={`sidebar__item ${isActive ? 'is-active' : ''} ${hasChildren ? 'has-children' : ''}`}
                title={collapsed ? item.label : undefined}
                type="button"
                onClick={() => {
                  if (hasChildren && !collapsed) {
                    toggleGroup(item.id);
                    return;
                  }

                  onNavigate(item.defaultPageId || item.id);
                }}
                aria-current={isActive ? 'page' : undefined}
                aria-expanded={hasChildren && !collapsed ? isOpen : undefined}
              >
                <Icon size={19} />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && hasChildren && (
                  <ChevronDown className="sidebar__item-chevron" size={15} />
                )}
              </button>

              {!collapsed && hasChildren && isOpen && (
                <div className="sidebar__subnav" aria-label={`${item.label} secoes`}>
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    const isOverviewChild = child.pageId === 'visao-geral';
                    const isChildActive = isOverviewChild
                      ? activePage === 'visao-geral' && activeOverviewView === child.viewId
                      : activePage === child.pageId;

                    return (
                      <button
                        key={child.id}
                        className={`sidebar__subitem ${isChildActive ? 'is-active' : ''}`}
                        type="button"
                        onClick={() => {
                          if (isOverviewChild) {
                            onOverviewViewChange(child.viewId);
                          }

                          onNavigate(child.pageId || item.id);
                        }}
                      >
                        <ChildIcon size={14} />
                        <span>{child.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
