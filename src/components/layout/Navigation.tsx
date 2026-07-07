import {
  childIsActive,
  groupHasActiveChild,
  getActiveGroupKeys,
  isNavGroup,
  isNavPathActive,
  NAV_ITEMS,
} from '@/constants/nav-items';
import { IMAGE_SIZE, NAV_ITEM_HEIGHT } from '@/constants/ui';
import { useGradientAccent, useNavBadgeCounts } from '@/hooks';
import { Badge, Group, NavLink, Tooltip } from '@mantine/core';
import { useEffect, useState, type ComponentType } from 'react';
import { Link, useLocation } from 'react-router-dom';

const collapsedNavStyles = {
  root: {
    justifyContent: 'center',
    height: NAV_ITEM_HEIGHT,
    padding: 'var(--mantine-spacing-xs)',
  },
  section: {
    marginRight: 0,
    marginLeft: 0,
  },
  body: {
    display: 'none',
  },
};

const expandedNavStyles = {
  root: {
    height: NAV_ITEM_HEIGHT,
  },
  section: {
    width: 24,
    minWidth: 24,
    display: 'flex',
    justifyContent: 'center',
  },
};

const getIconColor = (accent: string, isActive: boolean) =>
  `var(--mantine-color-${accent}-${isActive ? '6' : '5'})`;

function renderNavIcon(
  Icon: ComponentType<{ size?: number; color?: string }>,
  accent: string,
  isActive: boolean,
) {
  return (
    <Icon size={IMAGE_SIZE.ICON_LG} color={getIconColor(accent, isActive)} />
  );
}

export default function Navigation({
  onNavigate,
  showLabels,
  onExpand,
}: {
  onNavigate: () => void;
  showLabels: boolean;
  onExpand?: () => void;
}) {
  const location = useLocation();
  const { accent } = useGradientAccent();
  const navAccent = accent.primary;
  const { activeCodesCount, activeEventsCount } = useNavBadgeCounts();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const key of getActiveGroupKeys(location.pathname)) {
      initial[key] = true;
    }
    return initial;
  });

  useEffect(() => {
    const labelsToOpen = getActiveGroupKeys(location.pathname);

    if (labelsToOpen.length > 0) {
      queueMicrotask(() => {
        setOpenGroups((prev) => {
          const next = { ...prev };
          for (const label of labelsToOpen) {
            next[label] = true;
          }
          return next;
        });
      });
    }
  }, [location.pathname]);

  return (
    <>
      {NAV_ITEMS.map((item) => {
        if (item.children) {
          const isChildActive = item.children.some((child) =>
            childIsActive(child, location.pathname),
          );

          if (!showLabels) {
            return (
              <Tooltip
                key={item.label}
                label={item.label}
                position="right"
                withArrow
              >
                <NavLink
                  label=""
                  aria-label={`${item.label} navigation group`}
                  title={item.label}
                  leftSection={
                    item.icon &&
                    renderNavIcon(item.icon, navAccent, isChildActive)
                  }
                  active={isChildActive}
                  color={navAccent}
                  styles={collapsedNavStyles}
                  onClick={() => {
                    setOpenGroups((prev) => ({ ...prev, [item.label]: true }));
                    onExpand?.();
                  }}
                />
              </Tooltip>
            );
          }

          return (
            <NavLink
              key={item.label}
              label={item.label}
              opened={openGroups[item.label] ?? false}
              onChange={(opened) =>
                setOpenGroups((prev) => ({ ...prev, [item.label]: opened }))
              }
              childrenOffset={24}
              leftSection={
                item.icon &&
                renderNavIcon(item.icon, navAccent, isChildActive)
              }
              color={navAccent}
              styles={expandedNavStyles}
            >
              {item.children.map((child) => {
                if (isNavGroup(child)) {
                  const groupKey = `${item.label}>${child.label}`;
                  const isSubgroupActive = groupHasActiveChild(
                    child,
                    location.pathname,
                  );
                  return (
                    <NavLink
                      key={child.label}
                      label={child.label}
                      opened={openGroups[groupKey] ?? false}
                      onChange={(opened) =>
                        setOpenGroups((prev) => ({
                          ...prev,
                          [groupKey]: opened,
                        }))
                      }
                      childrenOffset={14}
                      leftSection={
                        child.icon &&
                        renderNavIcon(
                          child.icon,
                          navAccent,
                          isSubgroupActive,
                        )
                      }
                      active={isSubgroupActive}
                      color={navAccent}
                    >
                      {child.children.map((leaf) => (
                        <NavLink
                          key={leaf.path}
                          component={Link}
                          to={leaf.path}
                          label={leaf.label}
                          active={isNavPathActive(
                            leaf.path,
                            location.pathname,
                          )}
                          color={navAccent}
                          onClick={onNavigate}
                        />
                      ))}
                    </NavLink>
                  );
                }

                return (
                  <NavLink
                    key={child.path}
                    component={Link}
                    to={child.path}
                    label={child.label}
                    active={isNavPathActive(child.path, location.pathname)}
                    color={navAccent}
                    onClick={onNavigate}
                  />
                );
              })}
            </NavLink>
          );
        }

        const isActive = isNavPathActive(item.path!, location.pathname);

        if (!showLabels) {
          const tooltipLabel =
            item.label === 'Codes' && activeCodesCount > 0
              ? `${item.label} (${activeCodesCount})`
              : item.label === 'Events' && activeEventsCount > 0
                ? `${item.label} (${activeEventsCount})`
                : item.label;
          return (
            <Tooltip
              key={item.path}
              label={tooltipLabel}
              position="right"
              withArrow
            >
              <NavLink
                component={Link}
                to={item.path!}
                label=""
                aria-label={tooltipLabel}
                title={item.label}
                leftSection={
                  item.icon && renderNavIcon(item.icon, navAccent, isActive)
                }
                active={isActive}
                color={navAccent}
                onClick={onNavigate}
                styles={collapsedNavStyles}
              />
            </Tooltip>
          );
        }

        const label =
          item.label === 'Codes' && activeCodesCount > 0 ? (
            <Group gap={6} wrap="nowrap">
              <span>{item.label}</span>
              <Badge size="xs" variant="light" color="yellow" radius="sm">
                {activeCodesCount}
              </Badge>
            </Group>
          ) : item.label === 'Events' && activeEventsCount > 0 ? (
            <Group gap={6} wrap="nowrap">
              <span>{item.label}</span>
              <Badge size="xs" variant="light" color="green" radius="sm">
                {activeEventsCount}
              </Badge>
            </Group>
          ) : (
            item.label
          );

        return (
          <NavLink
            key={item.path}
            component={Link}
            to={item.path!}
            label={label}
            leftSection={
              item.icon && renderNavIcon(item.icon, navAccent, isActive)
            }
            active={isActive}
            color={navAccent}
            onClick={onNavigate}
            styles={expandedNavStyles}
          />
        );
      })}
    </>
  );
}
