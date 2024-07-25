import { Avatar, Button, Card, Col, Dropdown, Flex, MenuProps, Popconfirm, Row, Space, Tabs } from "antd";
import { IProjectInfo } from "./ProjectInfo";
import { CheckCircleOutlined, CodeOutlined, CrownOutlined, DeleteOutlined, EditOutlined, EllipsisOutlined, GroupOutlined, InfoCircleOutlined, SendOutlined } from "@ant-design/icons";
import { invoke } from "@tauri-apps/api/core";

interface ProjectListProps {
  dataSource: Required<IProjectInfo>[]
  getDataSource: () => void
  viewProject: (id: string) => void
  editProject: (id: string) => void
}

export default function ProjectList(props: ProjectListProps) {

  const { dataSource, getDataSource, viewProject, editProject } = props

  const runCommand = async (command = '', args?: string[]) => {
    debugger
    await invoke('run_command', { command, args })

    // 更新状态
    // Q1：能否做到检测应用程序是否已经关闭？
    // Q2：能否做到检测应用程序当前打开了这个项目？
  }

  // 使用编辑器打开项目
  const openProjectWithEditor = async (id: string) => {
    const projectInfo = dataSource.find(item => item.id === id)!
    await runCommand(projectInfo.editor, [projectInfo.projectPath])

  }

  // 使用终端打开项目
  const openProjectWithTerminal = async (id: string) => {
    await invoke('open_terminal_by_project_id', { id })
  }

  // 查看项目
  const viewProjectById = (id: string) => {
    viewProject(id)
  }

  // 编辑项目
  const editProjectById = (id: string) => {
    editProject(id)
  }

  // 删除项目
  const removeProject = async (id: string) => {
    await invoke('remove_projects', { ids: [id] })
    getDataSource()
  }

  const getItems = (id: string): MenuProps['items'] => {
    return [
      { key: 'view', icon: <InfoCircleOutlined />, label: '查看', onClick: () => viewProjectById(id) },
      { key: 'edit', icon: <EditOutlined />, label: '编辑', onClick: () => editProjectById(id) },
      { key: 'select', icon: <CheckCircleOutlined />, label: '选中' },
      { key: 'delete', icon: <DeleteOutlined />, label: '删除', onClick: () => removeProject(id) }
    ]
  }

  const getActions = (id: string) => {
    return [
      <SendOutlined onClick={() => openProjectWithEditor(id)} />,
      <CodeOutlined onClick={() => openProjectWithTerminal(id)} />,
      <Dropdown trigger={["click"]} menu={{ items: getItems(id) }} arrow>
        <EllipsisOutlined key="ellipsis" />
      </Dropdown>
    ]

  }

  const tabs = [
    {
      key: 'item',
      label: '',
      icon: <CrownOutlined />,
      // children: 所有项目 // TODO
    },
    {
      key: 'group',
      label: '',
      icon: <GroupOutlined />,
      // children: 群组 // TODO
      // 进入群组后支持查看群组内的项目（进入展示所有项目的页面，但是只展示群组内的项目）
    }
  ]

  return (
    <div>
      <Tabs
        // TODO
        items={tabs.map(item => ({
          key: item.key,
          label: item.label,
          icon: item.icon,
          children: (
            <Row gutter={16}>
              <Col span={8}>
                {
                  dataSource.map(item => (
                    // 按住 command 的时候点击鼠标左键选中多个项目
                    <div key={item.id} >
                      <Card
                        actions={getActions(item.id)}
                        cover={
                          <img
                            alt="example"
                            // public-apis 随机生成猫猫 cover 图片
                            src="https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png"
                          />
                        }
                      >
                        <Card.Meta
                          // 随机生成头像
                          avatar={<Avatar src="https://api.dicebear.com/7.x/miniavs/svg?seed=1" />}
                          title={item.projectName}
                          // description={item.projectPath}
                          description={"这里填写项目描述"}
                        >
                        </Card.Meta>
                      </Card>
                    </div>
                  ))
                }
              </Col>
            </Row>
          )
        }))}
      // tabBarExtraContent={<Space>
      //   <Button onClick={openAddProjectModal}>添加项目</Button>
      //   <Popconfirm title="清除所有数据" onConfirm={clearData}>
      //     <Button danger>清除数据</Button>
      //   </Popconfirm>
      // </Space>}
      />
    </div>
  )
}