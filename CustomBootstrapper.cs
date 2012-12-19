namespace NancyTest
{
    using System.Security.Principal;
    using System.Web;

    using Nancy;
    using Nancy.Authentication.Forms;
    using Nancy.Bootstrapper;
    using Nancy.Responses;
    using Nancy.TinyIoc;

    /// <summary>
    /// Custom Bootstrapper
    /// </summary>
    public class CustomBootstrapper : DefaultNancyBootstrapper
    {
        /// <summary>
        /// Applications the startup.
        /// </summary>
        /// <param name="container">The container.</param>
        /// <param name="pipelines">The pipelines.</param>
        protected override void ApplicationStartup(TinyIoCContainer container, IPipelines pipelines)
        {
            base.ApplicationStartup(container, pipelines);

            pipelines.BeforeRequest += ctx =>
            {
                var identity = (WindowsIdentity)HttpContext.Current.User.Identity;
                if (identity.IsAuthenticated)
                {
                    // Resolve<UserManager>
                    // Get from DB/Cache
                    // Add user to ICurrentUSerProvider
                    // Get Claims

                    ctx.CurrentUser = new DemoUserIdentity
                    {
                        UserName = identity.Name, 
                        Claims = new[] { "Basic", "Finance" }
                    };
                }

                return null;
            };

            pipelines.AfterRequest += ctx =>
            {
                // If status code comes back as Unauthorized then
                // forward the user to the unauthorised page
                //if (ctx.Response.StatusCode == HttpStatusCode.Unauthorized 
                //    || ctx.Response.StatusCode == HttpStatusCode.Forbidden)
                //{
                //    ctx.Response = new RedirectResponse("/Unauthorised");
                //}
            };
        }

        /// <summary>
        /// Requests the startup.
        /// </summary>
        /// <param name="container">The container.</param>
        /// <param name="pipelines">The pipelines.</param>
        /// <param name="context">The context.</param>
        protected override void RequestStartup(TinyIoCContainer container, IPipelines pipelines, NancyContext context)
        {
            base.RequestStartup(container, pipelines, context);

            var formsAuthConfiguration = new FormsAuthenticationConfiguration
            {
                RedirectUrl = "/Login",
                UserMapper = container.Resolve<IUserMapper>(),
            };

            FormsAuthentication.Enable(pipelines, formsAuthConfiguration);
        }
    }
}