const FollowService = require('../follow/follow-service');

const InitPostService = {
  getUserPosts(db, id) {
    return db
      .from('init_posts AS project')
      .select('*')
      .where('project.user_id', id)
      .orderBy('project.date_created', 'desc')
  },
  async getFeedPosts(db, user_id) {

    const following = await FollowService.getAllFollows(db, user_id);
    let feed = []
    await Promise.all(
      following.map(async f => {

        const { id } = f

        const followingData = await db
          .select('*')
          .from('init_posts')
          .where('user_id', id)
          .orderBy('date_created', 'asc')

        const dataWithUser = followingData.map(o => { return { ...o, ...f } })

        feed = [...feed, ...dataWithUser]

      }))

    return feed;
  },

  getPostCount(db, id) {
    return db
      .count('*')
      .from('init_posts')
      .where({ 'user_id': id })
  },

  insertPost(db, uploadData) {
    return db
      .insert(uploadData)
      .into('init_posts')
      .returning('*')
      .then(([data]) => data)
  },

  async getPostById(db, post_id) {

    try {
      return await db
        .select('*')
        .from('init_posts')
        .where({ id: post_id })
        .then(async p => {
          const [post] = p
          try {
            const user = await db
              .select('*')
              .from('user_information')
              .where({ id: post.user_id })

            return {
              ...user,
              ...post
            }
          }
          catch (error) {
            return console.log(error)
          }


        })

    }
    catch (error) {
      return console.log(error)
    }

  },
};

module.exports = InitPostService;